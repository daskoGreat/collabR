"use client";

import { resolveReport } from "@/lib/actions/admin";

interface AdminReport {
    id: string;
    reporterName: string;
    reporterAvatarId?: string;
    targetType: string;
    targetId: string;
    reason: string;
    status: string;
    resolverName: string | null;
    resolverAvatarId?: string | null;
    resolvedAt: string | null;
    createdAt: string;
}

import { AvatarPreview } from "@/components/avatar-builder/AvatarPreview";
import { Stack } from "@/components/layout/Stack";
import { Box } from "@/components/layout/Box";
import { Typography } from "@/components/ui/typography";
import { EmptyState } from "@/components/ui/EmptyState";
import { AlertCircle, CheckCircle, Clock, Trash2, Shield, User, FileText, MessageSquare } from "lucide-react";

interface Props {
    reports: AdminReport[];
}

export default function ReportsAdmin({ reports }: Props) {
    return (
        <Box style={{ background: "rgba(255,255,255,0.02)", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
            <Box style={{ padding: "2rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <Stack direction="horizontal" justify="between" align="center">
                    <Box>
                        <Typography style={{ fontSize: "1.25rem", fontWeight: 700 }}>Rapporter</Typography>
                        <Typography style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>
                            {reports.filter((r) => r.status === "PENDING").length} ärenden väntar på granskning
                        </Typography>
                    </Box>
                    <Shield size={24} style={{ color: "rgba(255,255,255,0.1)" }} />
                </Stack>
            </Box>

            {reports.length === 0 ? (
                <Box style={{ padding: "4rem 2rem" }}>
                    <EmptyState
                        icon={CheckCircle}
                        title="Inga öppna ärenden"
                        description="Allt ser bra ut. Inga rapporterade överträdelser just nu."
                    />
                </Box>
            ) : (
                <Box style={{ padding: "2rem" }}>
                    <Stack gap={16}>
                        {reports.map((report) => (
                            <Box key={report.id} style={{ padding: "1.5rem", background: "rgba(255,255,255,0.03)", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.08)" }}>
                                <Stack gap={16}>
                                    <Stack direction="horizontal" justify="between" align="center">
                                        <Stack direction="horizontal" gap={12} align="center">
                                            <Box style={{ padding: "6px 12px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
                                                <Stack direction="horizontal" gap={6} align="center">
                                                    {report.targetType === "USER" ? <User size={12} /> : report.targetType === "POST" ? <FileText size={12} /> : <MessageSquare size={12} />}
                                                    <Typography style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>{report.targetType}</Typography>
                                                </Stack>
                                            </Box>
                                            <Stack direction="horizontal" gap={8} align="center">
                                                <AvatarPreview
                                                    avatarId={report.reporterAvatarId}
                                                    name={report.reporterName}
                                                    size="xs"
                                                />
                                                <Typography style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>rapporterad av <span style={{ color: "white", fontWeight: 600 }}>{report.reporterName.toLowerCase()}</span></Typography>
                                            </Stack>
                                        </Stack>
                                        <span className={`badge ${report.status === "PENDING" ? "badge-yellow" : report.status === "RESOLVED" ? "badge-green" : "badge-muted"}`} style={{ fontSize: "0.7rem" }}>
                                            {report.status.toLowerCase()}
                                        </span>
                                    </Stack>

                                    <Typography style={{ fontSize: "0.95rem", color: "white", lineHeight: 1.5 }}>
                                        {report.reason}
                                    </Typography>

                                    <Stack direction="horizontal" justify="between" align="center" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1rem" }}>
                                        <Stack direction="horizontal" gap={12} align="center">
                                            <Clock size={12} style={{ color: "rgba(255,255,255,0.2)" }} />
                                            <Typography style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>
                                                {new Date(report.createdAt).toLocaleString("sv-SE")}
                                            </Typography>
                                            {report.resolverName && (
                                                <Stack direction="horizontal" gap={8} align="center" style={{ marginLeft: "1rem" }}>
                                                    <AvatarPreview
                                                        avatarId={report.resolverAvatarId || undefined}
                                                        name={report.resolverName}
                                                        size="xs"
                                                    />
                                                    <Typography style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>hanterad av {report.resolverName.toLowerCase()}</Typography>
                                                </Stack>
                                            )}
                                        </Stack>

                                        {report.status === "PENDING" && (
                                            <Stack direction="horizontal" gap={8}>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => resolveReport(report.id, "dismiss")}
                                                    style={{ color: "rgba(255,255,255,0.4)" }}
                                                >
                                                    avvisa
                                                </button>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => resolveReport(report.id, "resolve")}
                                                >
                                                    åtgärda
                                                </button>
                                            </Stack>
                                        )}
                                    </Stack>
                                </Stack>
                            </Box>
                        ))}
                    </Stack>
                </Box>
            )}
        </Box>
    );
}
