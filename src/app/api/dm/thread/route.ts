import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { targetUserId } = await req.json();
    if (!targetUserId) return NextResponse.json({ error: "targetUserId required" }, { status: 400 });

    const userId = session.user.id;
    if (userId === targetUserId) return NextResponse.json({ error: "cannot DM yourself" }, { status: 400 });

    // Ensure consistent ordering so @@unique([user1Id, user2Id]) works
    const [u1, u2] = [userId, targetUserId].sort();

    const thread = await prisma.directThread.upsert({
        where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
        create: { user1Id: u1, user2Id: u2 },
        update: {},
    });

    return NextResponse.json({ threadId: thread.id });
}
