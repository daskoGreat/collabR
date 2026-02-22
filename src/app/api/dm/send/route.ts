import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { threadId, content, attachments } = await req.json();
    if (!threadId || (!content?.trim() && (!attachments || attachments.length === 0))) {
        return NextResponse.json({ error: "threadId and content/attachment required" }, { status: 400 });
    }

    const userId = session.user.id;

    // Verify user is part of this thread
    const thread = await prisma.directThread.findUnique({ where: { id: threadId } });
    if (!thread || (thread.user1Id !== userId && thread.user2Id !== userId)) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const message = await prisma.directMessage.create({
        data: {
            threadId,
            userId,
            content: content.trim(),
            attachments: attachments ? {
                create: attachments.map((a: any) => ({
                    name: a.name,
                    url: a.url,
                    mimeType: a.mimeType,
                    size: a.size,
                    storageKey: a.url.split("/").pop() || "unknown",
                }))
            } : undefined
        },
        include: {
            user: { select: { id: true, name: true } },
            attachments: true
        },
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
            attachments: message.attachments,
        });

        // Notify recipient to refresh sidebar
        const recipientId = thread.user1Id === userId ? thread.user2Id : thread.user1Id;
        await pusher.trigger(`user-${recipientId}`, "sidebar-update", {});
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
