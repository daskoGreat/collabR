"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { Typography } from "@/components/ui/typography";
import { Box } from "@/components/layout/Box";
import { AvatarPreview } from "@/components/avatar-builder/AvatarPreview";
import { getAvatarConfig } from "@/lib/actions/avatar";
import { MessageCircle } from "lucide-react";

const CATEGORIES = [
    {
        id: "community",
        title: "Community",
        description: "Connect with others who are on a similar journey. Share experiences, ask questions, and support each other in a safe and open space."
    },
    {
        id: "coaching",
        title: "Coaching",
        description: "Get guidance from experienced coaches who can help you move forward, gain clarity, and turn your intentions into meaningful action."
    },
    {
        id: "psychological",
        title: "Psychological",
        description: "Access psychological tools and professional support to better understand yourself and strengthen your mental well-being."
    },
    {
        id: "spiritual",
        title: "Spiritual",
        description: "Explore spiritual practices and receive guidance and support to deepen awareness and connect with your inner self."
    }
];

export default function DashboardPortal() {
    const { data: session, status } = useSession();
    const [initializing, setInitializing] = useState(true);
    const [avatarConfig, setAvatarConfig] = useState<any>(null);

    useEffect(() => {
        async function fetchAvatar() {
            try {
                const config = await getAvatarConfig();
                if (config && !('error' in config)) {
                    setAvatarConfig(config);
                }
            } finally {
                // Architectural pattern: ensure minimum load time for smooth transition
                setTimeout(() => setInitializing(false), 800);
            }
        }
        if (status === "authenticated") {
            fetchAvatar();
        }
    }, [status]);

    if (status === "loading" || initializing) {
        return (
            <Box style={{ minHeight: '100vh', background: '#000000', color: '#ffffff', padding: '4rem 2rem' }}>
                <Container style={{ maxWidth: '1000px' }}>
                    <Stack gap={80}>
                        <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Stack direction="horizontal" gap={32} align="center">
                                <Box className="skeleton-pulse" style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                                <Box>
                                    <Box className="skeleton-pulse" style={{ width: '300px', height: '48px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', marginBottom: '12px' }} />
                                    <Box className="skeleton-pulse" style={{ width: '200px', height: '48px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }} />
                                </Box>
                            </Stack>
                            <Box className="skeleton-pulse" style={{ width: '100px', height: '100px', borderRadius: '50% 50% 50% 0', background: 'rgba(255,255,255,0.02)' }} />
                        </Box>
                        <Stack align="center" gap={48}>
                            <Box className="skeleton-pulse" style={{ width: '250px', height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }} />
                            <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2.5rem', width: '100%' }}>
                                {[1, 2, 3, 4].map(i => (
                                    <Box key={i} className="skeleton-pulse" style={{ height: '300px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)' }} />
                                ))}
                            </Box>
                        </Stack>
                    </Stack>
                </Container>
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .skeleton-pulse { animation: skeleton-load 1.5s infinite linear; }
                    @keyframes skeleton-load { 0% { opacity: 0.4; } 50% { opacity: 0.8; } 100% { opacity: 0.4; } }
                `}} />
            </Box>
        );
    }

    const userName = session?.user?.name || "Member";

    return (
        <Box style={{
            minHeight: '100vh',
            background: '#000000',
            color: '#ffffff',
            padding: '4rem 2rem'
        }}>
            <Container style={{ maxWidth: '1000px' }}>
                <Stack direction="vertical" gap={80}>

                    {/* Header Section */}
                    <Box style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%'
                    }}>
                        <Stack direction="horizontal" gap={32} align="center">
                            {/* Avatar Preview */}
                            <Box style={{
                                width: '120px',
                                height: '120px',
                                flexShrink: 0
                            }}>
                                <AvatarPreview
                                    avatarId={avatarConfig?.avatarId}
                                    name={userName}
                                    size={120}
                                />
                            </Box>

                            <Typography style={{
                                fontSize: 'min(4rem, 8vw)',
                                fontWeight: 700,
                                fontFamily: 'var(--font-outfit)',
                                lineHeight: 1.1,
                                marginLeft: '1rem'
                            }}>
                                Hello {userName}, welcome<br />to your dashboard!
                            </Typography>
                        </Stack>

                        {/* Messages Bubble */}
                        <Link href="/messages" style={{ textDecoration: 'none' }}>
                            <Box style={{
                                width: '100px',
                                height: '100px',
                                border: '3px solid',
                                borderImageSource: 'linear-gradient(to bottom, var(--neon-green), #00e676)',
                                borderImageSlice: 1,
                                borderRadius: '50% 50% 50% 0',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                gap: '4px',
                                background: 'rgba(0, 230, 118, 0.05)',
                                transition: 'all 0.2s'
                            }} className="hover:scale-105 active:scale-95">
                                <MessageCircle size={24} style={{ color: 'var(--neon-green)' }} />
                                <Typography style={{ fontWeight: 700, fontSize: '0.8rem', fontFamily: 'var(--font-inter)', color: 'white' }}>
                                    Messages
                                </Typography>
                            </Box>
                        </Link>
                    </Box>

                    {/* Start Exploring Section */}
                    <Stack direction="vertical" gap={48} align="center">
                        <Typography style={{
                            fontSize: '2.5rem',
                            fontWeight: 600,
                            fontFamily: 'var(--font-outfit)',
                            marginBottom: '1rem'
                        }}>
                            Start Exploring
                        </Typography>

                        <Box style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '2.5rem',
                            width: '100%'
                        }}>
                            {CATEGORIES.map((cat) => (
                                <Stack key={cat.id} direction="vertical" gap={24} align="center" style={{
                                    textAlign: 'center',
                                    padding: '2rem',
                                    borderRadius: '32px',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                }} className="hover:bg-white/[0.04] hover:border-white/10 hover:-translate-y-2">
                                    <Typography style={{
                                        fontSize: '1.75rem',
                                        fontWeight: 700,
                                        fontFamily: 'var(--font-outfit)'
                                    }}>
                                        {cat.title}
                                    </Typography>

                                    <Typography style={{
                                        fontSize: '0.95rem',
                                        lineHeight: 1.6,
                                        color: 'rgba(255,255,255,0.6)',
                                        fontFamily: 'var(--font-inter)',
                                        minHeight: '100px'
                                    }}>
                                        {cat.description}
                                    </Typography>

                                    <Link href={`/network/${cat.id}`} style={{
                                        textDecoration: 'none',
                                        width: '100%',
                                        marginTop: '1rem'
                                    }}>
                                        <Box style={{
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: '12px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: '#ffffff',
                                            fontWeight: 700,
                                            transition: 'all 0.2s'
                                        }} className="hover:bg-white/10">
                                            Explore
                                        </Box>
                                    </Link>
                                </Stack>
                            ))}
                        </Box>
                    </Stack>

                </Stack>
            </Container>
        </Box>
    );
}
