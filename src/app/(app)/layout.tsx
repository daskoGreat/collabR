import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import AppShell from "@/components/app-shell";

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const user = session.user as { id: string; name: string; email: string; role: string };

    const spaces = await prisma.spaceMember.findMany({
        where: { userId: user.id },
        include: { space: { include: { channels: true } } },
        orderBy: { space: { name: "asc" } },
    });

    // Admin can see all spaces
    const allSpaces =
        user.role === "ADMIN"
            ? await prisma.space.findMany({ include: { channels: true }, orderBy: { name: "asc" } })
            : spaces.map((sm) => sm.space);

    // Fetch DM threads for sidebar
    const threadMemberships = await prisma.threadMember.findMany({
        where: { userId: user.id },
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
    const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

    const dmList = await Promise.all(threadMemberships.map(async (membership) => {
        const t = membership.thread;
        const lastRead = membership.joinedAt;

        const unreadCount = await prisma.directMessage.count({
            where: {
                threadId: t.id,
                userId: { not: user.id },
                createdAt: { gt: lastRead }
            }
        });

        const mentionCount = await prisma.mention.count({
            where: {
                userId: user.id,
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
            const otherMember = t.members.find(m => m.userId !== user.id);
            const otherUser = otherMember?.user || { id: "unknown", name: "Borttagen användare", lastSeenAt: null };
            const isOnline = otherUser.lastSeenAt &&
                (now.getTime() - new Date(otherUser.lastSeenAt).getTime() < ONLINE_THRESHOLD_MS);

            return {
                id: t.id,
                otherUser: { id: otherUser.id, name: otherUser.name },
                isGroup: false,
                isOnline: !!isOnline,
                unreadCount,
                hasMention: mentionCount > 0
            };
        }
    }));

    return (
        <AppShell
            user={user}
            spaces={allSpaces}
            dmThreads={dmList}
        >
            {children}
        </AppShell>
    );
}
