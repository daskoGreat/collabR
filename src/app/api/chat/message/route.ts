import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { messageId, content } = await req.json();
        if (!messageId || !content?.trim()) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        const message = await prisma.message.findUnique({
            where: { id: messageId },
            select: { userId: true, channelId: true },
        });

        if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });
        if (message.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const updated = await prisma.message.update({
            where: { id: messageId },
            data: { content: content.trim() },
        });

        // Optional: Broadcast update via Pusher if needed
        // For now, simple polling will catch it or we can just rely on local state for the editor

        return NextResponse.json(updated);
    } catch (err) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const messageId = searchParams.get("id");
        if (!messageId) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        const message = await prisma.message.findUnique({
            where: { id: messageId },
            select: { userId: true },
        });

        if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });
        if (message.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        await prisma.message.delete({ where: { id: messageId } });

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
