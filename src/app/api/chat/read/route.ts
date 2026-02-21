import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { channelId } = await req.json();
        if (!channelId) return NextResponse.json({ error: "Missing channelId" }, { status: 400 });

        const userId = session.user.id;

        await prisma.channelReadReceipt.upsert({
            where: { userId_channelId: { userId, channelId } },
            update: { lastReadAt: new Date() },
            create: { userId, channelId, lastReadAt: new Date() },
        });

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
