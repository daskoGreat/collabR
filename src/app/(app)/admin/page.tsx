import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";

export default async function AdminDashboard() {
    await requireRole("ADMIN", "MODERATOR");

    const [userCount, spaceCount, inviteCount, pendingReports, recentActions] =
        await Promise.all([
            prisma.user.count(),
            prisma.space.count(),
            prisma.invite.count({ where: { revoked: false } }),
            prisma.report.count({ where: { status: "PENDING" } }),
            prisma.auditLog.findMany({
                orderBy: { createdAt: "desc" },
                take: 10,
                include: { user: { select: { name: true } } },
            }),
        ]);

    return (
        <>
            <div className="topbar">
                <div className="topbar-title">
                    <span className="topbar-title-highlight">⚙</span> admin dashboard
                </div>
            </div>
            <div className="content-area">
                <div className="stats-grid">
                    <div className="card stat-card">
                        <div className="stat-value">{userCount}</div>
                        <div className="stat-label">users</div>
                    </div>
                    <div className="card stat-card">
                        <div className="stat-value">{spaceCount}</div>
                        <div className="stat-label">spaces</div>
                    </div>
                    <div className="card stat-card">
                        <div className="stat-value">{inviteCount}</div>
                        <div className="stat-label">active invites</div>
                    </div>
                    <div className="card stat-card">
                        <div className="stat-value" style={pendingReports > 0 ? { color: "var(--accent-danger)" } : {}}>
                            {pendingReports}
                        </div>
                        <div className="stat-label">pending reports</div>
                    </div>
                </div>

                <h3 className="page-title mb-4" style={{ fontSize: "var(--font-size-md)" }}>
                    recent actions
                </h3>
                {recentActions.length === 0 ? (
                    <p className="text-muted text-sm">no actions logged yet.</p>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>action</th>
                                    <th>by</th>
                                    <th>target</th>
                                    <th>when</th>
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
