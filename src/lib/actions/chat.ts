"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireUser() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    return session.user as { id: string, name: string };
}

export async function getThreadData(threadId: string) {
    const user = await requireUser();

    const thread = await prisma.directThread.findUnique({
        where: { id: threadId },
        include: {
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            lastSeenAt: true,
                            avatarConfig: { select: { avatarId: true } }
                        }
                    }
                }
            }
        },
    });

    if (!thread) return { error: "not_found" };

    const membership = thread.members.find(m => m.userId === user.id);
    if (!membership) return { error: "forbidden" };

    const messages = await prisma.directMessage.findMany({
        where: { threadId },
        orderBy: { createdAt: "asc" },
        take: 50,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    avatarConfig: { select: { avatarId: true } }
                }
            },
            attachments: true
        },
    });

    return {
        success: true,
        thread: {
            ...thread,
            messages: messages.map((m: any) => ({
                id: m.id,
                content: m.content,
                createdAt: m.createdAt.toISOString(),
                user: m.user,
                attachments: m.attachments,
            }))
        }
    };
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

    revalidatePath(`/messages/${threadId}`);
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

    revalidatePath(`/messages`);
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
