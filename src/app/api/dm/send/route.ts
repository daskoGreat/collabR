import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { threadId, content } = await req.json();
    if (!threadId || !content?.trim()) {
        return NextResponse.json({ error: "threadId and content required" }, { status: 400 });
    }

    const userId = session.user.id;

    // Verify user is part of this thread
    const thread = await prisma.directThread.findUnique({ where: { id: threadId } });
    if (!thread || (thread.user1Id !== userId && thread.user2Id !== userId)) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const message = await prisma.directMessage.create({
        data: { threadId, userId, content: content.trim() },
        include: { user: { select: { id: true, name: true } } },
    });

    // Trigger Pusher for realtime (best-effort)
    try {
        const { getPusherServer } = await import("@/lib/pusher-server");
        const pusher = getPusherServer();
        await pusher.trigger(`dm-${threadId}`, "new-dm", {
            id: message.id,
            content: message.content,
            createdAt: message.createdAt.toISOString(),
            user: message.user,
        });
    } catch {
        // Pusher not configured, polling fallback handles it
    }

    return NextResponse.json({
        id: message.id,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        user: message.user,
    });
}
