import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import InvitesAdmin from "./invites-admin";
import BackButton from "@/components/back-button";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { Typography } from "@/components/ui/typography";
import { Box } from "@/components/layout/Box";

export default async function AdminInvitesPage() {
    await requireRole("ADMIN");

    const invites = await prisma.invite.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            creator: {
                select: {
                    name: true,
                    avatarConfig: { select: { avatarId: true } }
                }
            }
        },
    });

    // Get all registered users to check status
    const registeredEmails = await prisma.user.findMany({
        select: { email: true }
    }).then(users => new Set(users.map(u => u.email.toLowerCase())));

    return (
        <Container style={{ paddingBottom: '4rem', paddingTop: '2rem' }}>
            <Stack gap={48}>
                <Box>
                    <Stack direction="horizontal" gap={16} align="center" style={{ marginBottom: "1.5rem" }}>
                        <BackButton />
                        <Stack direction="horizontal" gap={8} align="center">
                            <Typography style={{ color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>administratör</Typography>
                            <Typography style={{ color: "rgba(255,255,255,0.2)" }}>/</Typography>
                            <Typography style={{ color: "white", fontWeight: 700 }}>inbjudningshantering</Typography>
                        </Stack>
                    </Stack>

                    <Typography style={{ fontSize: "2.5rem", fontWeight: 700, fontFamily: "var(--font-outfit)" }}>
                        Inbjudningar
                    </Typography>
                </Box>

                <InvitesAdmin
                    invites={invites.map((i: any) => ({
                        id: i.id,
                        token: i.token,
                        email: i.email,
                        createdBy: i.creator.name,
                        creatorAvatarId: i.creator.avatarConfig?.avatarId,
                        maxUses: i.maxUses,
                        uses: i.uses,
                        singleUse: i.singleUse,
                        expiresAt: i.expiresAt?.toISOString() || null,
                        revoked: i.revoked,
                        createdAt: i.createdAt.toISOString(),
                        isRegistered: i.email ? registeredEmails.has(i.email.toLowerCase()) : false,
                    }))}
                />
            </Stack>
        </Container>
    );
}
