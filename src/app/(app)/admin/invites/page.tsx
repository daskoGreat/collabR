import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import InvitesAdmin from "./invites-admin";
import BackButton from "@/components/back-button";

export default async function AdminInvitesPage() {
    await requireRole("ADMIN");

    const invites = await prisma.invite.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            creator: { select: { name: true } }
        },
    });

    // Get all registered users to check status
    const registeredEmails = await prisma.user.findMany({
        select: { email: true }
    }).then(users => new Set(users.map(u => u.email.toLowerCase())));

    return (
        <>
            <div className="topbar">
                <div className="row" style={{ gap: "var(--space-4)" }}>
                    <BackButton />
                    <div className="topbar-title">
                        <span className="text-muted">admin /</span>{" "}
                        <span className="topbar-title-highlight">⊞</span> invite management
                    </div>
                </div>
            </div>
            <InvitesAdmin
                invites={invites.map((i: any) => ({
                    id: i.id,
                    token: i.token,
                    email: i.email,
                    createdBy: i.creator.name,
                    maxUses: i.maxUses,
                    uses: i.uses,
                    singleUse: i.singleUse,
                    expiresAt: i.expiresAt?.toISOString() || null,
                    revoked: i.revoked,
                    createdAt: i.createdAt.toISOString(),
                    isRegistered: i.email ? registeredEmails.has(i.email.toLowerCase()) : false,
                }))}
            />
        </>
    );
}
