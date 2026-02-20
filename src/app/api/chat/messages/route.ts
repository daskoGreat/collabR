import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");
    const after = searchParams.get("after"); // message id to fetch after

    if (!channelId) {
        return NextResponse.json({ error: "channelId required" }, { status: 400 });
    }

    // Verify channel exists and user has access
    const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        select: { spaceId: true },
    });

    if (!channel) {
        return NextResponse.json({ error: "channel not found" }, { status: 404 });
    }

    // Check membership
    const userRole = (session.user as { role: string }).role;
    if (userRole !== "ADMIN") {
        const member = await prisma.spaceMember.findUnique({
            where: { userId_spaceId: { userId: session.user.id, spaceId: channel.spaceId } },
        });
        if (!member) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // If `after` is provided, fetch only messages newer than that message
    let cursor: { createdAt: Date } | undefined;
    if (after) {
        const ref = await prisma.message.findUnique({
            where: { id: after },
            select: { createdAt: true },
        });
        if (ref) cursor = { createdAt: ref.createdAt };
    }

    const messages = await prisma.message.findMany({
        where: {
            channelId,
            deletedAt: null,
            ...(cursor ? { createdAt: { gt: cursor.createdAt } } : {}),
        },
        orderBy: { createdAt: "asc" },
        take: 50,
        include: { user: { select: { id: true, name: true } } },
    });

    return NextResponse.json(
        messages.map((m) => ({
            id: m.id,
            content: m.content,
            createdAt: m.createdAt.toISOString(),
            user: { id: m.user.id, name: m.user.name },
        }))
    );
}
