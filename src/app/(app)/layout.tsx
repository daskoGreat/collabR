import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import AppSidebar from "@/components/app-sidebar";

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
        include: { space: true },
        orderBy: { space: { name: "asc" } },
    });

    // Admin can see all spaces
    const allSpaces =
        user.role === "ADMIN"
            ? await prisma.space.findMany({ orderBy: { name: "asc" } })
            : spaces.map((sm: typeof spaces[number]) => sm.space);

    // Fetch DM threads for sidebar
    const dmThreads = await prisma.directThread.findMany({
        where: { OR: [{ user1Id: user.id }, { user2Id: user.id }] },
        include: {
            user1: { select: { id: true, name: true } },
            user2: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    const dmList = dmThreads.map((t) => ({
        id: t.id,
        otherUser: t.user1Id === user.id ? t.user2 : t.user1,
    }));

    return (
        <div className="app-shell">
            <AppSidebar
                user={user}
                spaces={allSpaces}
                dmThreads={dmList}
            />
            <div className="main-content">{children}</div>
        </div>
    );
}
