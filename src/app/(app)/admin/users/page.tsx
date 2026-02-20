import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import UsersAdmin from "./users-admin";

export default async function AdminUsersPage() {
    const currentUser = await requireRole("ADMIN");

    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            _count: { select: { spaceMemberships: true } },
        },
    });

    return (
        <>
            <div className="topbar">
                <div className="topbar-title">
                    <span className="topbar-title-highlight">⊡</span> user management
                </div>
            </div>
            <UsersAdmin
                users={users.map((u) => ({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    role: u.role,
                    banned: u.banned,
                    bannedReason: u.bannedReason,
                    spaceCount: u._count.spaceMemberships,
                    createdAt: u.createdAt.toISOString(),
                }))}
                currentUserId={currentUser.id}
            />
        </>
    );
}
