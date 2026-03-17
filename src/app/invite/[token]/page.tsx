import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import InviteForm from "./invite-form";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { Typography } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { Box } from "@/components/layout/Box";

interface Props {
    params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: Props) {
    const { token } = await params;

    const invite = await prisma.invite.findUnique({
        where: { token },
        include: {
            creator: { select: { name: true } },
            user: { select: { name: true, email: true } }
        },
    });

    if (!invite) return notFound();

    const isExpired = invite.expiresAt && invite.expiresAt < new Date();
    const isUsedUp =
        invite.singleUse
            ? invite.uses >= 1
            : invite.maxUses > 0 && invite.uses >= invite.maxUses;
    const isRevoked = invite.revoked;
    const isInvalid = isExpired || isUsedUp || isRevoked;

    const prefill = invite.user ? { name: invite.user.name, email: invite.user.email } : null;

    return (
        <Box style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Container>
                <Stack direction="vertical" align="center" justify="center" gap="xl" style={{ minHeight: '100vh', padding: 'var(--space-xl) 0' }}>

                    <Typography variant="h1" style={{ textAlign: 'center' }}>
                        The Support Network
                    </Typography>

                    <Box style={{ width: '100%', maxWidth: '500px' }}>
                        <Card>
                            <Stack direction="vertical" gap="md">
                                {isInvalid ? (
                                    <Stack direction="vertical" align="center" gap="md" style={{ textAlign: "center" }}>
                                        <Typography variant="h3" style={{ color: 'var(--accent-danger)' }}>
                                            {isRevoked && "This invite has been revoked."}
                                            {isExpired && "This invite has expired."}
                                            {isUsedUp && "This invite has been fully used."}
                                        </Typography>
                                        <Typography variant="body" className="text-secondary">
                                            Ask an admin for a fresh invite link.
                                        </Typography>
                                    </Stack>
                                ) : (
                                    <Stack direction="vertical" gap="lg">
                                        <Stack direction="vertical" gap="xs">
                                            <Typography variant="h3">
                                                <span style={{ color: 'var(--accent-accent)' }}>{invite.creator.name}</span> invited you.
                                            </Typography>
                                            <Typography variant="caption" className="text-secondary">
                                                Create your account to join the network.
                                            </Typography>
                                        </Stack>

                                        <Box style={{ background: 'var(--bg-tertiary)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent-accent)' }}>
                                            <Typography variant="caption" style={{ fontWeight: 'bold' }} className="uppercase tracking-widest">Ground Rules</Typography>
                                            <Typography variant="body" style={{ marginTop: '8px', fontSize: '13px' }}>
                                                This is a safe space. Ask anything, help generously, Skip the judgment. No question is too basic. We're all here to learn and build together.
                                            </Typography>
                                        </Box>

                                        <InviteForm token={token} prefill={prefill} />
                                    </Stack>
                                )}
                            </Stack>
                        </Card>
                    </Box>

                    <Typography variant="caption" className="text-secondary opacity-40">
                        ~/onboarding_sequence_active
                    </Typography>
                </Stack>
            </Container>
        </Box>
    );
}
