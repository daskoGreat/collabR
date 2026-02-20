"use client";

import { resolveReport } from "@/lib/actions/admin";

interface Report {
    id: string;
    reporterName: string;
    targetType: string;
    targetId: string;
    reason: string;
    status: string;
    resolverName: string | null;
    resolvedAt: string | null;
    createdAt: string;
}

interface Props {
    reports: Report[];
}

export default function ReportsAdmin({ reports }: Props) {
    return (
        <div className="content-area">
            <div className="page-header">
                <div>
                    <h1 className="page-title">reports</h1>
                    <p className="page-subtitle">
                        {reports.filter((r) => r.status === "PENDING").length} pending
                    </p>
                </div>
            </div>

            {reports.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">⚑</div>
                    <div className="empty-state-title">no reports</div>
                    <div className="empty-state-text">all clear. that&apos;s the energy.</div>
                </div>
            ) : (
                <div className="stack">
                    {reports.map((report) => (
                        <div key={report.id} className="card card-compact">
                            <div className="row-between mb-2">
                                <div className="row">
                                    <span className="badge badge-muted">{report.targetType}</span>
                                    <span className="text-sm font-semibold">
                                        reported by {report.reporterName}
                                    </span>
                                </div>
                                <span
                                    className={`badge ${report.status === "PENDING"
                                            ? "badge-yellow"
                                            : report.status === "RESOLVED"
                                                ? "badge-green"
                                                : "badge-muted"
                                        }`}
                                >
                                    {report.status.toLowerCase()}
                                </span>
                            </div>
                            <p className="text-sm text-secondary mb-2">{report.reason}</p>
                            <div className="row-between">
                                <span className="text-xs text-muted">
                                    {new Date(report.createdAt).toLocaleString("sv-SE")}
                                    {report.resolverName && ` — handled by ${report.resolverName}`}
                                </span>
                                {report.status === "PENDING" && (
                                    <div className="row">
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => resolveReport(report.id, "resolve")}
                                        >
                                            resolve
                                        </button>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => resolveReport(report.id, "dismiss")}
                                        >
                                            dismiss
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
