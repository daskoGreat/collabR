import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import BackButton from "@/components/back-button";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { Box } from "@/components/layout/Box";
import { Typography } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { Check, Clock } from "lucide-react";

export default async function SettingsPage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    return (
        <Container style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-xl)' }}>
            <Stack direction="vertical" gap="xl" style={{ maxWidth: '640px', margin: '0 auto' }}>
                <Box>
                    <BackButton />
                </Box>

                <Stack direction="vertical" gap="md">
                    <Typography variant="h1">Settings</Typography>
                    <Typography variant="body" className="text-secondary">
                        Manage your preferences and interface settings.
                    </Typography>
                </Stack>

                <Stack direction="vertical" gap="lg">
                    <Card>
                        <Stack direction="vertical" gap="md">
                            <Typography variant="h3">Notifications</Typography>
                            <Stack direction="vertical" gap="sm">
                                <Box style={{ padding: 'var(--space-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                                    <Stack direction="horizontal" justify="between" align="center">
                                        <Stack direction="vertical" gap="none">
                                            <Typography variant="body" style={{ fontWeight: 600 }}>Desktop Notifications</Typography>
                                            <Typography variant="caption" className="text-secondary">Receive alerts while the browser is open</Typography>
                                        </Stack>
                                        <Box className="text-primary">
                                            <Check size={18} />
                                        </Box>
                                    </Stack>
                                </Box>
                                <Box style={{ padding: 'var(--space-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', opacity: 0.5 }}>
                                    <Stack direction="horizontal" justify="between" align="center">
                                        <Stack direction="vertical" gap="none">
                                            <Typography variant="body" style={{ fontWeight: 600 }}>Email Digests</Typography>
                                            <Typography variant="caption" className="text-secondary">Summary of missed activity</Typography>
                                        </Stack>
                                        <Stack direction="horizontal" gap="xs" align="center" className="text-secondary">
                                            <Clock size={14} />
                                            <Typography variant="caption" style={{ fontWeight: 800 }}>SOON</Typography>
                                        </Stack>
                                    </Stack>
                                </Box>
                            </Stack>
                        </Stack>
                    </Card>

                    <Card>
                        <Stack direction="vertical" gap="md">
                            <Typography variant="h3">Apperance</Typography>
                            <Stack direction="vertical" gap="sm">
                                <Box style={{ padding: 'var(--space-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--accent-primary)', borderRadius: 'var(--radius-md)' }}>
                                    <Stack direction="horizontal" justify="between" align="center">
                                        <Stack direction="vertical" gap="none">
                                            <Typography variant="body" style={{ fontWeight: 600 }} className="text-primary">Dark Mode (Default)</Typography>
                                            <Typography variant="caption" className="text-primary" style={{ opacity: 0.7 }}>Support Network Standard</Typography>
                                        </Stack>
                                        <Box className="text-primary">
                                            <Check size={18} />
                                        </Box>
                                    </Stack>
                                </Box>
                                <Box style={{ padding: 'var(--space-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', opacity: 0.5 }}>
                                    <Stack direction="horizontal" justify="between" align="center">
                                        <Stack direction="vertical" gap="none">
                                            <Typography variant="body" style={{ fontWeight: 600 }}>Light Mode</Typography>
                                            <Typography variant="caption" className="text-secondary">Classic high-contrast look</Typography>
                                        </Stack>
                                        <Typography variant="caption" className="text-secondary" style={{ fontWeight: 800 }}>UNAVAILABLE</Typography>
                                    </Stack>
                                </Box>
                            </Stack>
                        </Stack>
                    </Card>
                </Stack>

                <Box style={{ textAlign: 'center', opacity: 0.3 }}>
                    <Typography variant="caption" style={{ letterSpacing: '0.2em', fontWeight: 800 }}>
                        THE SUPPORT NETWORK V1.0.0-STABLE
                    </Typography>
                </Box>
            </Stack>
        </Container>
    );
}
