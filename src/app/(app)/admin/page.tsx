import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import BackButton from "@/components/back-button";

export default async function AdminDashboard() {
    await requireRole("ADMIN", "MODERATOR");

    const [userCount, spaceCount, inviteCount, pendingReports, pendingRequests, recentActions] =
        await Promise.all([
            prisma.user.count(),
            prisma.space.count(),
            prisma.invite.count({ where: { revoked: false } }),
            prisma.report.count({ where: { status: "PENDING" } }),
            prisma.joinRequest.count({ where: { status: "PENDING" } }),
            prisma.auditLog.findMany({
                orderBy: { createdAt: "desc" },
                take: 10,
                include: { user: { select: { name: true } } },
            }),
        ]);

    return (
        <>
            <div className="topbar">
                <div className="row" style={{ gap: "var(--space-4)" }}>
                    <BackButton />
                    <div className="topbar-title">
                        <span className="topbar-title-highlight">⚙</span> överblick
                    </div>
                </div>
            </div>
            <div className="content-area">
                <div className="stats-grid">
                    <div className="card stat-card">
                        <div className="stat-value">{userCount}</div>
                        <div className="stat-label">användare</div>
                    </div>
                    <div className="card stat-card">
                        <div className="stat-value">{spaceCount}</div>
                        <div className="stat-label">kontor</div>
                    </div>
                    <div className="card stat-card">
                        <div className="stat-value">{inviteCount}</div>
                        <div className="stat-label">aktiva inbjudningar</div>
                    </div>
                    <div className="card stat-card">
                        <div className="stat-value" style={pendingRequests > 0 ? { color: "var(--neon-green)" } : {}}>
                            {pendingRequests}
                        </div>
                        <div className="stat-label">väntande förfrågningar</div>
                    </div>
                    <div className="card stat-card">
                        <div className="stat-value" style={pendingReports > 0 ? { color: "var(--accent-danger)" } : {}}>
                            {pendingReports}
                        </div>
                        <div className="stat-label">väntande rapporter</div>
                    </div>
                </div>

                <h3 className="page-title mb-4" style={{ fontSize: "var(--font-size-md)" }}>
                    senaste händelser
                </h3>
                {recentActions.length === 0 ? (
                    <p className="text-muted text-sm">inga åtgärder loggade än.</p>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>åtgärd</th>
                                    <th>av</th>
                                    <th>mål</th>
                                    <th>när</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentActions.map((action: typeof recentActions[number]) => (
                                    <tr key={action.id}>
                                        <td>
                                            <span className="badge badge-muted">{action.action}</span>
                                        </td>
                                        <td className="text-cyan">{action.user.name}</td>
                                        <td className="text-muted">{action.targetType || "—"}</td>
                                        <td className="text-muted">
                                            {new Date(action.createdAt).toLocaleString("sv-SE")}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
