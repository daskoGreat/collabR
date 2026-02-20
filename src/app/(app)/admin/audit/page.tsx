import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";

export default async function AdminAuditPage() {
    await requireRole("ADMIN");

    const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { user: { select: { name: true } } },
    });

    return (
        <>
            <div className="topbar">
                <div className="topbar-title">
                    <span className="topbar-title-highlight">◎</span> audit log
                </div>
            </div>
            <div className="content-area">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">audit log</h1>
                        <p className="page-subtitle">all admin actions, no exceptions</p>
                    </div>
                </div>

                {logs.length === 0 ? (
                    <p className="text-muted text-sm">no actions logged yet.</p>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>timestamp</th>
                                    <th>user</th>
                                    <th>action</th>
                                    <th>target</th>
                                    <th>details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id}>
                                        <td className="text-muted text-xs">
                                            {new Date(log.createdAt).toLocaleString("sv-SE")}
                                        </td>
                                        <td className="text-cyan">{log.user.name}</td>
                                        <td>
                                            <span className="badge badge-muted">{log.action}</span>
                                        </td>
                                        <td className="text-muted">
                                            {log.targetType ? `${log.targetType}` : "—"}
                                        </td>
                                        <td className="text-xs text-muted">
                                            {log.metadata ? (
                                                <code>{JSON.stringify(log.metadata)}</code>
                                            ) : (
                                                "—"
                                            )}
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
