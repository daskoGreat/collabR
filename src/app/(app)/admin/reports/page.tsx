import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import ReportsAdmin from "./reports-admin";
import BackButton from "@/components/back-button";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { Typography } from "@/components/ui/typography";
import { Box } from "@/components/layout/Box";

export default async function AdminReportsPage() {
    await requireRole("ADMIN", "MODERATOR");

    const reports = await prisma.report.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            reporter: {
                select: {
                    name: true,
                    avatarConfig: { select: { avatarId: true } }
                }
            },
            resolver: {
                select: {
                    name: true,
                    avatarConfig: { select: { avatarId: true } }
                }
            },
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
                            <Typography style={{ color: "white", fontWeight: 700 }}>rapporter</Typography>
                        </Stack>
                    </Stack>

                    <Typography style={{ fontSize: "2.5rem", fontWeight: 700, fontFamily: "var(--font-outfit)" }}>
                        Rapporter & Granskning
                    </Typography>
                </Box>

                <ReportsAdmin
                    reports={reports.map((r: any) => ({
                        id: r.id,
                        reporterName: r.reporter.name,
                        reporterAvatarId: r.reporter.avatarConfig?.avatarId,
                        targetType: r.targetType,
                        targetId: r.targetId,
                        reason: r.reason,
                        status: r.status,
                        resolverName: r.resolver?.name || null,
                        resolverAvatarId: r.resolver?.avatarConfig?.avatarId || null,
                        resolvedAt: r.resolvedAt?.toISOString() || null,
                        createdAt: r.createdAt.toISOString(),
                    }))}
                />
            </Stack>
        </Container>
    );
}
