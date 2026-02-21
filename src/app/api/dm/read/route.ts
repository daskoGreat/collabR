import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { threadId } = await req.json();
        if (!threadId) return NextResponse.json({ error: "Missing threadId" }, { status: 400 });

        const userId = session.user.id;

        const thread = await prisma.directThread.findUnique({
            where: { id: threadId },
        });

        if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

        if (thread.user1Id === userId) {
            await prisma.directThread.update({
                where: { id: threadId },
                data: { lastReadUser1At: new Date() },
            });
        } else if (thread.user2Id === userId) {
            await prisma.directThread.update({
                where: { id: threadId },
                data: { lastReadUser2At: new Date() },
            });
        } else {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Trigger sidebar refresh for immediate badge update
        try {
            const { getPusherServer } = await import("@/lib/pusher-server");
            const pusher = getPusherServer();
            await pusher.trigger(`user-${userId}`, "sidebar-update", {});
        } catch {
            // ignore
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
