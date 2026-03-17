import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import BackButton from "@/components/back-button";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { Typography } from "@/components/ui/typography";
import { Box } from "@/components/layout/Box";
import { Settings, Users, Building, Mail, FileText, AlertCircle } from "lucide-react";

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
        <Container style={{ paddingBottom: '4rem', paddingTop: '2rem' }}>
            <Stack gap={48}>
                <Box>
                    <Stack direction="horizontal" gap={16} align="center" style={{ marginBottom: "1.5rem" }}>
                        <BackButton />
                        <Stack direction="horizontal" gap={8} align="center">
                            <Typography style={{ color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>administratör</Typography>
                            <Typography style={{ color: "rgba(255,255,255,0.2)" }}>/</Typography>
                            <Typography style={{ color: "white", fontWeight: 700 }}>överblick</Typography>
                        </Stack>
                    </Stack>

                    <Typography style={{ fontSize: "2.5rem", fontWeight: 700, fontFamily: "var(--font-outfit)" }}>
                        Systemöverblick
                    </Typography>
                </Box>

                <Box style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1.5rem" }}>
                    {[
                        { label: "Användare", value: userCount, icon: Users, color: "var(--neon-green)" },
                        { label: "Kontor", value: spaceCount, icon: Building, color: "rgba(255,255,255,0.6)" },
                        { label: "Inbjudningar", value: inviteCount, icon: Mail, color: "rgba(255,255,255,0.6)" },
                        { label: "Förfrågningar", value: pendingRequests, icon: FileText, color: pendingRequests > 0 ? "var(--neon-green)" : "rgba(255,255,255,0.3)" },
                        { label: "Rapporter", value: pendingReports, icon: AlertCircle, color: pendingReports > 0 ? "var(--accent-danger)" : "rgba(255,255,255,0.3)" },
                    ].map((stat, i) => (
                        <Box key={i} style={{
                            background: "rgba(255,255,255,0.02)",
                            borderRadius: "24px",
                            padding: "2rem",
                            border: "1px solid rgba(255,255,255,0.05)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem"
                        }}>
                            <stat.icon size={16} style={{ color: "rgba(255,255,255,0.2)", marginBottom: "0.5rem" }} />
                            <Typography style={{ fontSize: "2rem", fontWeight: 700, color: stat.color }}>{stat.value}</Typography>
                            <Typography style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</Typography>
                        </Box>
                    ))}
                </Box>

                <Box style={{ background: "rgba(255,255,255,0.02)", borderRadius: "32px", padding: "2.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <Typography style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "2rem" }}>Senaste händelser</Typography>

                    {recentActions.length === 0 ? (
                        <Typography style={{ color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>inga åtgärder loggade än.</Typography>
                    ) : (
                        <Box style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                        <th style={{ padding: "1rem", color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700 }}>åtgärd</th>
                                        <th style={{ padding: "1rem", color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700 }}>av</th>
                                        <th style={{ padding: "1rem", color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700 }}>mål</th>
                                        <th style={{ padding: "1rem", color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700 }}>när</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentActions.map((action: any) => (
                                        <tr key={action.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                                            <td style={{ padding: "1rem" }}>
                                                <Box style={{ display: "inline-block", padding: "0.25rem 0.75rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", fontSize: "0.75rem", fontWeight: 600 }}>
                                                    {action.action}
                                                </Box>
                                            </td>
                                            <td style={{ padding: "1rem", color: "var(--neon-green)", fontWeight: 600 }}>{action.user.name}</td>
                                            <td style={{ padding: "1rem", color: "rgba(255,255,255,0.6)" }}>{action.targetType || "—"}</td>
                                            <td style={{ padding: "1rem", color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
                                                {new Date(action.createdAt).toLocaleString("sv-SE")}
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
