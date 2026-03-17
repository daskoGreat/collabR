import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { targetUserId, participants, name } = await req.json();
    const userId = session.user.id;

    if (!targetUserId && (!participants || participants.length === 0)) {
        return NextResponse.json({ error: "targetUserId or participants required" }, { status: 400 });
    }

    // 1:1 Chat logic
    if (targetUserId) {
        if (userId === targetUserId) return NextResponse.json({ error: "cannot DM yourself" }, { status: 400 });

        // Try to find existing 1:1 thread
        const [u1, u2] = [userId, targetUserId].sort();
        let thread = await prisma.directThread.findFirst({
            where: {
                isGroup: false,
                OR: [
                    { user1Id: u1, user2Id: u2 },
                    { user1Id: u2, user2Id: u1 }
                ]
            }
        });

        if (!thread) {
            thread = await prisma.directThread.create({
                data: {
                    user1Id: u1,
                    user2Id: u2,
                    isGroup: false,
                    members: {
                        create: [
                            { userId: u1, role: "OWNER" },
                            { userId: u2, role: "MEMBER" }
                        ]
                    }
                }
            });
        }

        return NextResponse.json({ threadId: thread.id });
    }

    // Group Chat logic
    const allParticipants = Array.from(new Set([...participants, userId]));
    if (allParticipants.length < 2) {
        return NextResponse.json({ error: "at least 2 participants required" }, { status: 400 });
    }

    const thread = await prisma.directThread.create({
        data: {
            name: name || null,
            isGroup: true,
            members: {
                create: allParticipants.map(pid => ({
                    userId: pid,
                    role: pid === userId ? "OWNER" : "MEMBER"
                }))
            }
        }
    });

    return NextResponse.json({ threadId: thread.id });
}
