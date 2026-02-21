import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 1 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    const spaceMembers = await prisma.spaceMember.findMany({
        where: { userId },
        include: {
            space: {
                include: {
                    channels: {
                        include: {
                            _count: {
                                select: {
                                    messages: {
                                        where: { userId: { not: userId } }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        orderBy: { space: { name: "asc" } },
    });

    const threadUnreads = await Promise.all(
        spaceMembers.flatMap(sm => sm.space.channels).map(async (ch) => {
            const receipt = await prisma.channelReadReceipt.findUnique({
                where: { userId_channelId: { userId, channelId: ch.id } }
            });

            const unreadCount = await prisma.message.count({
                where: {
                    channelId: ch.id,
                    userId: { not: userId },
                    createdAt: { gt: receipt?.lastReadAt || new Date(0) }
                }
            });

            return { id: ch.id, unreadCount };
        })
    );

    const spaces = spaceMembers.map(sm => ({
        ...sm.space,
        channels: sm.space.channels.map(ch => ({
            ...ch,
            unreadCount: threadUnreads.find(t => t.id === ch.id)?.unreadCount || 0
        }))
    }));

    const dmThreads = await prisma.directThread.findMany({
        where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
        include: {
            user1: { select: { id: true, name: true } },
            user2: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    const dmList = await Promise.all(dmThreads.map(async (t) => {
        const isUser1 = t.user1Id === userId;
        const lastRead = isUser1 ? t.lastReadUser1At : t.lastReadUser2At;
        const otherUser = isUser1 ? t.user2 : t.user1;

        const unreadCount = await prisma.directMessage.count({
            where: {
                threadId: t.id,
                userId: { not: userId },
                createdAt: { gt: lastRead }
            }
        });

        return {
            id: t.id,
            otherUser,
            unreadCount
        };
    }));

    return NextResponse.json({ spaces, dmThreads: dmList });
}
