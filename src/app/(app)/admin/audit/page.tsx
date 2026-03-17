import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import BackButton from "@/components/back-button";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { Box } from "@/components/layout/Box";
import { Typography } from "@/components/ui/typography";
import { AvatarPreview } from "@/components/avatar-builder/AvatarPreview";
import { EmptyState } from "@/components/ui/EmptyState";
import { Activity, Clock, Shield, User, Globe, AlertCircle, Search } from "lucide-react";

export default async function AdminAuditPage() {
    await requireRole("ADMIN");

    const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
            user: {
                select: {
                    name: true,
                    avatarConfig: { select: { avatarId: true } }
                }
            }
        },
    });

    return (
        <Container style={{ paddingBottom: '4rem', paddingTop: '2rem' }}>
            <Stack gap={48}>
                <Box>
                    <Stack direction="horizontal" gap={16} align="center" style={{ marginBottom: "1.5rem" }}>
                        <BackButton />
                        <Stack direction="horizontal" gap={8} align="center">
                            <Typography style={{ color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>administratör</Typography>
                            <Typography style={{ color: "rgba(255,255,255,0.2)" }}>/</Typography>
                            <Typography style={{ color: "white", fontWeight: 700 }}>händelselogg</Typography>
                        </Stack>
                    </Stack>

                    <Typography style={{ fontSize: "2.5rem", fontWeight: 700, fontFamily: "var(--font-outfit)" }}>
                        Systemets Händelselogg
                    </Typography>
                </Box>

                <Box style={{ background: "rgba(255,255,255,0.02)", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
                    <Box style={{ padding: "2rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <Stack direction="horizontal" justify="between" align="center">
                            <Box>
                                <Typography style={{ fontSize: "1.25rem", fontWeight: 700 }}>Senaste åtgärder</Typography>
                                <Typography style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>
                                    Visar de 100 senaste administratörshändelserna
                                </Typography>
                            </Box>
                            <Activity size={24} style={{ color: "rgba(255,255,255,0.1)" }} />
                        </Stack>
                    </Box>

                    {logs.length === 0 ? (
                        <Box style={{ padding: "4rem 2rem" }}>
                            <EmptyState
                                icon={Search}
                                title="Inga händelser loggade"
                                description="Det finns inga loggade åtgärder i systemet ännu."
                            />
                        </Box>
                    ) : (
                        <Box style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                                        <th style={{ textAlign: "left", padding: "1.5rem 2rem", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em" }}>Tidpunkt</th>
                                        <th style={{ textAlign: "left", padding: "1.5rem 2rem", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em" }}>Aktör</th>
                                        <th style={{ textAlign: "left", padding: "1.5rem 2rem", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em" }}>Åtgärd</th>
                                        <th style={{ textAlign: "left", padding: "1.5rem 2rem", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em" }}>Objekt</th>
                                        <th style={{ textAlign: "left", padding: "1.5rem 2rem", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em" }}>Detaljer</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log: any) => (
                                        <tr key={log.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                                            <td style={{ padding: "1.5rem 2rem" }}>
                                                <Stack direction="horizontal" gap={8} align="center">
                                                    <Clock size={12} style={{ color: "rgba(255,255,255,0.2)" }} />
                                                    <Typography style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>
                                                        {new Date(log.createdAt).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" })}
                                                    </Typography>
                                                </Stack>
                                            </td>
                                            <td style={{ padding: "1.5rem 2rem" }}>
                                                <Stack direction="horizontal" gap={12} align="center">
                                                    <AvatarPreview
                                                        avatarId={(log.user as any).avatarConfig?.avatarId}
                                                        name={log.user.name}
                                                        size="xs"
                                                    />
                                                    <Typography style={{ fontSize: "0.95rem", fontWeight: 600 }}>{log.user.name.toLowerCase()}</Typography>
                                                </Stack>
                                            </td>
                                            <td style={{ padding: "1.5rem 2rem" }}>
                                                <Box style={{ padding: "6px 12px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", display: "inline-block" }}>
                                                    <Typography style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>{log.action.toLowerCase()}</Typography>
                                                </Box>
                                            </td>
                                            <td style={{ padding: "1.5rem 2rem" }}>
                                                <Typography style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>{log.targetType || "—"}</Typography>
                                            </td>
                                            <td style={{ padding: "1.5rem 2rem" }}>
                                                <Box style={{ padding: "8px", background: "rgba(0,0,0,0.2)", borderRadius: "8px", maxWidth: "200px" }}>
                                                    <Typography style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {log.metadata ? JSON.stringify(log.metadata) : "—"}
                                                    </Typography>
                                                </Box>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Box>
                    )}
                </Box>
            </Stack>
        </Container>
    );
}
