import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import BackButton from "@/components/back-button";

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
                <div className="row" style={{ gap: "var(--space-4)" }}>
                    <BackButton />
                    <div className="topbar-title">
                        <span className="text-muted opacity-50">admin /</span>{" "}
                        <span className="topbar-title-highlight">◎</span> händelselogg
                    </div>
                </div>
            </div>
            <div className="content-area">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">händelselogg</h1>
                        <p className="page-subtitle">alla admin-åtgärder, inga undantag</p>
                    </div>
                </div>

                {logs.length === 0 ? (
                    <p className="text-muted text-sm">inga åtgärder loggade än.</p>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>tidsstämpel</th>
                                    <th>användare</th>
                                    <th>åtgärd</th>
                                    <th>mål</th>
                                    <th>detaljer</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log: typeof logs[number]) => (
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
