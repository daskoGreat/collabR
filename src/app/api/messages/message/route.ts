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

        const message = await prisma.directMessage.findUnique({
            where: { id: messageId },
            select: { userId: true },
        });

        if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });
        if (message.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const updated = await prisma.directMessage.update({
            where: { id: messageId },
            data: { content: content.trim() },
        });

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

        const message = await prisma.directMessage.findUnique({
            where: { id: messageId },
            select: { userId: true },
        });

        if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });
        if (message.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        await prisma.directMessage.delete({ where: { id: messageId } });

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
