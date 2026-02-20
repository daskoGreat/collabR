"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function getUser() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("unauthorized");
    return session.user as { id: string; name: string; role: string };
}

async function assertCanManageChannel(spaceId: string, userId: string, role: string) {
    if (role === "ADMIN" || role === "MODERATOR") return;
    const member = await prisma.spaceMember.findUnique({
        where: { userId_spaceId: { userId, spaceId } },
    });
    if (!member || (member.role !== "ADMIN" && member.role !== "MODERATOR")) {
        throw new Error("forbidden");
    }
}

export async function createChannel(spaceId: string, name: string) {
    const user = await getUser();
    await assertCanManageChannel(spaceId, user.id, user.role);

    const trimmed = name.trim().toLowerCase().replace(/\s+/g, "-");
    if (!trimmed) throw new Error("channel name required");

    const existing = await prisma.channel.findFirst({
        where: { spaceId, name: trimmed },
    });
    if (existing) throw new Error("channel already exists");

    const channel = await prisma.channel.create({
        data: { spaceId, name: trimmed },
    });

    await prisma.auditLog.create({
        data: {
            userId: user.id,
            action: "channel.create",
            targetType: "channel",
            targetId: channel.id,
            metadata: { name: trimmed },
        },
    });

    revalidatePath(`/spaces/${spaceId}`);
    return channel;
}

export async function deleteChannel(channelId: string) {
    const user = await getUser();

    const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        select: { spaceId: true, name: true },
    });
    if (!channel) throw new Error("not found");

    await assertCanManageChannel(channel.spaceId, user.id, user.role);

    await prisma.channel.delete({ where: { id: channelId } });

    await prisma.auditLog.create({
        data: {
            userId: user.id,
            action: "channel.delete",
            targetType: "channel",
            targetId: channelId,
            metadata: { name: channel.name },
        },
    });

    revalidatePath(`/spaces/${channel.spaceId}`);
}
