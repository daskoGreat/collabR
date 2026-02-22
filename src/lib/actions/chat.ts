"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireUser() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    return session.user as { id: string, name: string };
}

export async function updatePresence() {
    const user = await requireUser();
    await prisma.user.update({
        where: { id: user.id },
        data: { lastSeenAt: new Date() }
    });
}

export async function renameThread(threadId: string, name: string) {
    const user = await requireUser();

    // Verify ownership or membership (requirement: OWNER or any member? Let's say any member for now, or OWNER if we want to be strict)
    const membership = await prisma.threadMember.findUnique({
        where: { threadId_userId: { threadId, userId: user.id } }
    });

    if (!membership) throw new Error("Forbidden");

    await prisma.directThread.update({
        where: { id: threadId },
        data: { name }
    });

    revalidatePath(`/dm/${threadId}`);
    revalidatePath(`/api/sidebar`);

    // Notify Pusher
    try {
        const { getPusherServer } = await import("@/lib/pusher-server");
        const pusher = getPusherServer();
        const members = await prisma.threadMember.findMany({
            where: { threadId },
            select: { userId: true }
        });

        for (const member of members) {
            await pusher.trigger(`user-${member.userId}`, "sidebar-update", {});
        }
        await pusher.trigger(`dm-${threadId}`, "thread-updated", { type: "rename", name });
    } catch { }
}

export async function leaveThread(threadId: string) {
    const user = await requireUser();

    await prisma.threadMember.delete({
        where: { threadId_userId: { threadId, userId: user.id } }
    });

    // If no members left, delete thread or just leave it
    const memberCount = await prisma.threadMember.count({ where: { threadId } });
    if (memberCount === 0) {
        // Option: delete thread if empty
        // await prisma.directThread.delete({ where: { id: threadId } });
    }

    revalidatePath(`/dm`);
    revalidatePath(`/api/sidebar`);

    // Notify Pusher
    try {
        const { getPusherServer } = await import("@/lib/pusher-server");
        const pusher = getPusherServer();
        const members = await prisma.threadMember.findMany({
            where: { threadId },
            select: { userId: true }
        });

        for (const member of members) {
            await pusher.trigger(`user-${member.userId}`, "sidebar-update", {});
        }
        await pusher.trigger(`dm-${threadId}`, "thread-updated", { type: "leave", userId: user.id });
    } catch { }
}
