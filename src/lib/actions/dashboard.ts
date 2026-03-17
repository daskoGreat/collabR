"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function getDashboardData() {
    const session = await auth();
    if (!session?.user?.id) return { error: "unauthorized" };

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                spaceMemberships: {
                    include: {
                        space: {
                            include: {
                                _count: {
                                    select: { channels: true, members: true }
                                }
                            }
                        }
                    }
                },
                mentions: {
                    take: 5,
                    orderBy: { createdAt: "desc" },
                    include: {
                        message: { include: { channel: { select: { name: true, spaceId: true } } } },
                        directMessage: { select: { threadId: true } },
                        post: { select: { id: true, title: true, spaceId: true } }
                    }
                }
            }
        });

        if (!user) return { error: "user not found" };

        const spaceIds = user.spaceMemberships.map((m: any) => m.spaceId);

        const onlineUsers = await prisma.user.findMany({
            where: {
                lastSeenAt: { gte: new Date(Date.now() - 1000 * 60 * 5) },
                id: { not: user.id }
            },
            select: { id: true, name: true }
        });

        // Fetch latest help posts for Pulse
        const latestHelp = await prisma.post.findMany({
            where: { spaceId: { in: spaceIds }, solved: false },
            take: 10,
            orderBy: { createdAt: "desc" },
            include: { user: { select: { id: true, name: true } }, space: { select: { id: true, name: true } } }
        });

        // Fetch collaborations (spaces user is in)
        const collaborations = await prisma.space.findMany({
            where: { members: { some: { userId: user.id } } },
            include: {
                channels: true,
                members: {
                    include: { user: { select: { id: true, name: true } } },
                    take: 5
                }
            },
        });

        return {
            success: true,
            user,
            spaceIds,
            onlineUsers,
            latestHelp,
            collaborations
        };
    } catch (error) {
        console.error("Dashboard data fetch failed:", error);
        return { error: "failed to fetch dashboard data" };
    }
}
