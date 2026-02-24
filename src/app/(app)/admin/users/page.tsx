import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import UsersAdmin from "./users-admin";
import BackButton from "@/components/back-button";

export default async function AdminUsersPage() {
    const currentUser = await requireRole("ADMIN");

    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            _count: { select: { spaceMemberships: true } },
            invites: {
                orderBy: { createdAt: "desc" },
                take: 1,
            }
        },
    });

    return (
        <>
            <div className="topbar">
                <div className="row" style={{ gap: "var(--space-4)" }}>
                    <BackButton />
                    <div className="topbar-title">
                        <span className="text-muted">admin /</span>{" "}
                        <span className="topbar-title-highlight">⊡</span> användarhantering
                    </div>
                </div>
            </div>
            <UsersAdmin
                users={users.map((u: any) => ({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    passwordHash: u.passwordHash,
                    role: u.role,
                    banned: u.banned,
                    bannedReason: u.bannedReason,
                    spaceCount: u._count.spaceMemberships,
                    createdAt: u.createdAt.toISOString(),
                    invites: u.invites.map((i: any) => ({
                        token: i.token,
                        expiresAt: i.expiresAt?.toISOString() || null,
                        revoked: i.revoked,
                        uses: i.uses,
                    })),
                }))}
                currentUserId={currentUser.id}
            />
        </>
    );
}
