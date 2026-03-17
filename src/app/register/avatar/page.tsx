"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { SupportLayout } from "@/components/layout/SupportLayout";
import { Box } from "@/components/layout/Box";
import { Stack } from "@/components/layout/Stack";
import { Typography } from "@/components/ui/typography";
import { AvatarPreview } from "@/components/avatar-builder/AvatarPreview";
import { AvatarModal } from "@/components/avatar-builder/AvatarModal";
import { getAvatarConfig, saveAvatarConfig } from "@/lib/actions/avatar";
import { useState, useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function AvatarOnboardingPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [avatarConfig, setAvatarConfig] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(true); // Open by default
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchConfig() {
            if (status === "authenticated") {
                const config = await getAvatarConfig();
                if (config && !('error' in config)) {
                    setAvatarConfig(config);
                }
                setLoading(false);
            }
        }
        fetchConfig();
    }, [status]);

    if (status === "loading" || loading) {
        return (
            <Box style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LoadingSpinner />
            </Box>
        );
    }

    if (status === "unauthenticated") {
        router.push("/login");
        return null;
    }

    const handleAvatarSelect = async (avatarId: string) => {
        try {
            await saveAvatarConfig({ avatarId });
            router.push("/network"); // Redirect to portal after selection
        } catch (error) {
            console.error("Error saving avatar:", error);
        }
    };

    const userName = session?.user?.name || "there";

    return (
        <SupportLayout
            title={`Welcome, ${userName}.`}
            subtitle="Let's set up your digital identity. Choose an avatar that feels like you."
            backHref="/register"
        >
            <Box style={{ marginTop: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3rem' }}>
                <Box style={{ width: '200px', height: '200px', position: 'relative' }}>
                    <AvatarPreview avatarId={avatarConfig?.avatarId} size={200} />
                </Box>

                <Stack direction="vertical" gap={16} align="center">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        style={{
                            background: '#ffffff',
                            color: '#000000',
                            padding: '1.25rem 3rem',
                            borderRadius: '9999px',
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Choose your avatar
                    </button>

                    <button
                        onClick={() => router.push("/network")}
                        style={{
                            background: 'transparent',
                            color: 'rgba(255,255,255,0.4)',
                            border: 'none',
                            textDecoration: 'underline',
                            fontSize: '0.9rem',
                            cursor: 'pointer'
                        }}
                    >
                        Skip for now
                    </button>
                </Stack>
            </Box>

            <AvatarModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSelect={handleAvatarSelect}
                currentAvatarId={avatarConfig?.avatarId}
            />
        </SupportLayout>
    );
}
