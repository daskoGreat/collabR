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
                        where: {
                            OR: [
                                { isClosed: false },
                                { members: { some: { userId } } }
                            ]
                        },
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

            const lastReadAt = receipt?.lastReadAt || new Date(0);

            const unreadCount = await prisma.message.count({
                where: {
                    channelId: ch.id,
                    userId: { not: userId },
                    createdAt: { gt: lastReadAt }
                }
            });

            const mentionCount = await prisma.mention.count({
                where: {
                    userId,
                    message: { channelId: ch.id },
                    readAt: null
                }
            });

            return { id: ch.id, unreadCount, mentionCount };
        })
    );

    const spaces = spaceMembers.map(sm => ({
        ...sm.space,
        channels: sm.space.channels.map(ch => {
            const counts = threadUnreads.find(t => t.id === ch.id);
            return {
                ...ch,
                unreadCount: counts?.unreadCount || 0,
                hasMention: (counts?.mentionCount || 0) > 0
            };
        })
    }));

    const threadMemberships = await prisma.threadMember.findMany({
        where: { userId },
        include: {
            thread: {
                include: {
                    members: {
                        include: {
                            user: { select: { id: true, name: true, lastSeenAt: true } }
                        }
                    }
                }
            }
        },
        orderBy: { thread: { createdAt: "desc" } },
    });

    const now = new Date();
    const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

    const dmList = await Promise.all(threadMemberships.map(async (membership) => {
        const t = membership.thread;
        const lastRead = membership.joinedAt; // Fallback or use a better lastRead field if available

        const unreadCount = await prisma.directMessage.count({
            where: {
                threadId: t.id,
                userId: { not: userId },
                createdAt: { gt: lastRead } // This should be updated by a "read" API
            }
        });

        const mentionCount = await prisma.mention.count({
            where: {
                userId,
                directMessage: { threadId: t.id },
                readAt: null
            }
        });

        if (t.isGroup) {
            return {
                id: t.id,
                name: t.name || "Namnlös grupp",
                isGroup: true,
                memberCount: t.members.length,
                unreadCount,
                hasMention: mentionCount > 0
            };
        } else {
            // Find the other user in 1:1
            const otherMember = t.members.find(m => m.userId !== userId);
            const otherUser = otherMember?.user || { id: "unknown", name: "Borttagen användare", lastSeenAt: null };

            const isOnline = otherUser.lastSeenAt &&
                (now.getTime() - new Date(otherUser.lastSeenAt).getTime() < ONLINE_THRESHOLD_MS);

            return {
                id: t.id,
                otherUser,
                isGroup: false,
                isOnline,
                unreadCount,
                hasMention: mentionCount > 0
            };
        }
    }));

    const unreadOpportunityMentions = await prisma.mention.count({
        where: {
            userId,
            readAt: null,
            OR: [
                { opportunityId: { not: null } },
                { opportunityCommentId: { not: null } }
            ]
        }
    });

    const unreadFeedMentions = await prisma.mention.count({
        where: {
            userId,
            readAt: null,
            OR: [
                { feedPostId: { not: null } },
                { feedCommentId: { not: null } }
            ]
        }
    });

    const openHelpCount = await prisma.post.count({
        where: {
            spaceId: { in: spaceMembers.map(sm => sm.spaceId) },
            solved: false,
            userId: { not: userId }
        }
    });

    return NextResponse.json({
        spaces,
        dmThreads: dmList,
        hasOpportunityMention: unreadOpportunityMentions > 0,
        hasFeedMention: unreadFeedMentions > 0,
        openHelpCount
    });
}
