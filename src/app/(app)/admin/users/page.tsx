import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import UsersAdmin from "./users-admin";
import BackButton from "@/components/back-button";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { Typography } from "@/components/ui/typography";
import { Box } from "@/components/layout/Box";

export default async function AdminUsersPage() {
    const currentUser = await requireRole("ADMIN");

    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            avatarConfig: { select: { avatarId: true } },
            _count: { select: { spaceMemberships: true } },
            invites: {
                orderBy: { createdAt: "desc" },
                take: 1,
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
                            <Typography style={{ color: "white", fontWeight: 700 }}>användarhantering</Typography>
                        </Stack>
                    </Stack>

                    <Typography style={{ fontSize: "2.5rem", fontWeight: 700, fontFamily: "var(--font-outfit)" }}>
                        Användare
                    </Typography>
                </Box>

                <UsersAdmin
                    users={users.map((u: any) => ({
                        id: u.id,
                        name: u.name,
                        email: u.email,
                        avatarId: u.avatarConfig?.avatarId,
                        passwordHash: u.passwordHash,
                        role: u.role,
                        banned: u.banned,
                        bannedReason: u.bannedReason,
                        spaceCount: u._count.spaceMemberships,
                        createdAt: u.createdAt.toISOString(),
                        invites: u.invites.map((i: any) => ({
                            token: i.token,
                            expiresAt: i.expiresAt?.toISOString() || null,
                            revoked: i.revoked,
                            uses: i.uses,
                        })),
                    }))}
                    currentUserId={currentUser.id}
                />
            </Stack>
        </Container>
    );
}
