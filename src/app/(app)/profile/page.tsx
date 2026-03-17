"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { SupportLayout } from "@/components/layout/SupportLayout";
import { Box } from "@/components/layout/Box";
import { Stack } from "@/components/layout/Stack";
import { Typography } from "@/components/ui/typography";
import { AvatarPreview } from "@/components/avatar-builder/AvatarPreview";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, LogOut, User, Mail, Shield, Camera } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const [initializing, setInitializing] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            // Simulate architectural loading like Coaches page
            const timer = setTimeout(() => {
                setInitializing(false);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [status, router]);

    if (status === "loading" || initializing) {
        return (
            <SupportLayout title="Profil">
                <Box style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
                    <Box style={{
                        background: "rgba(255,255,255,0.02)",
                        borderRadius: "32px",
                        padding: "3rem",
                        border: "1px solid rgba(255,255,255,0.05)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center"
                    }}>
                        <Skeleton width="120px" height="120px" borderRadius="50%" style={{ marginBottom: "2rem" }} />
                        <Skeleton width="200px" height="32px" style={{ marginBottom: "1rem" }} />
                        <Skeleton width="150px" height="20px" style={{ marginBottom: "3rem" }} />
                        <Box style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                            <Skeleton height="100px" borderRadius="20px" />
                            <Skeleton height="100px" borderRadius="20px" />
                        </Box>
                    </Box>
                </Box>
            </SupportLayout>
        );
    }

    const user = session?.user as any;

    return (
        <SupportLayout
            title="Din Profil"
            subtitle="Hantera din identitet i The Support Network."
        >
            <Box style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
                <Stack gap={32}>
                    {/* Identity Card */}
                    <Box style={{
                        background: "#16181c",
                        borderRadius: "32px",
                        padding: "3rem",
                        border: "1px solid rgba(255,255,255,0.05)",
                        boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
                        textAlign: "center"
                    }}>
                        <Box style={{ position: "relative", width: "120px", height: "120px", margin: "0 auto 2rem" }}>
                            <AvatarPreview
                                avatarId={user?.avatarId}
                                name={user?.name}
                                size="xl"
                                backgroundColor="rgba(255,255,255,0.03)"
                            />
                            <Link href="/avatar" style={{
                                position: "absolute",
                                bottom: "0",
                                right: "0",
                                background: "var(--neon-green)",
                                color: "black",
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: "4px solid #16181c",
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }} className="hover:scale-110 active:scale-95">
                                <Camera size={18} />
                            </Link>
                        </Box>

                        <Typography style={{
                            fontSize: "2rem",
                            fontWeight: 800,
                            fontFamily: "var(--font-outfit)",
                            color: "white",
                            marginBottom: "0.5rem"
                        }}>
                            {user?.name}
                        </Typography>

                        <Typography style={{
                            fontSize: "1rem",
                            color: "rgba(255,255,255,0.4)",
                            fontWeight: 500,
                            marginBottom: "3rem"
                        }}>
                            {user?.email}
                        </Typography>

                        <Box style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: "1.5rem",
                            textAlign: "left"
                        }}>
                            <Box style={{
                                padding: "1.5rem",
                                background: "rgba(255,255,255,0.02)",
                                borderRadius: "20px",
                                border: "1px solid rgba(255,255,255,0.03)"
                            }}>
                                <Stack gap={8}>
                                    <Stack direction="horizontal" gap={8} align="center">
                                        <User size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
                                        <Typography style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Användarnamn</Typography>
                                    </Stack>
                                    <Typography style={{ fontWeight: 600 }}>@{user?.name?.toLowerCase().replace(/\s+/g, '')}</Typography>
                                </Stack>
                            </Box>

                            <Box style={{
                                padding: "1.5rem",
                                background: "rgba(255,255,255,0.02)",
                                borderRadius: "20px",
                                border: "1px solid rgba(255,255,255,0.03)"
                            }}>
                                <Stack gap={8}>
                                    <Stack direction="horizontal" gap={8} align="center">
                                        <Shield size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
                                        <Typography style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Roll</Typography>
                                    </Stack>
                                    <Typography style={{ fontWeight: 600 }}>{user?.role || 'Medlem'}</Typography>
                                </Stack>
                            </Box>
                        </Box>
                    </Box>

                    {/* Actions */}
                    <Stack gap={12}>
                        <Link href="/avatar" style={{ textDecoration: "none" }}>
                            <Box style={{
                                padding: "1.25rem 2rem",
                                background: "rgba(255,255,255,0.03)",
                                borderRadius: "16px",
                                border: "1px solid rgba(255,255,255,0.05)",
                                display: "flex",
                                justifyContent: "between",
                                alignItems: "center",
                                transition: "all 0.2s"
                            }} className="hover:bg-white/5 active:scale-[0.99]">
                                <Stack direction="horizontal" gap={16} align="center">
                                    <Box style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(0, 230, 118, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <Camera size={20} color="var(--neon-green)" />
                                    </Box>
                                    <Box>
                                        <Typography style={{ fontWeight: 700, color: "white" }}>Ändra Avatar</Typography>
                                        <Typography style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>Välj en bild som representerar dig</Typography>
                                    </Box>
                                </Stack>
                                <ArrowRight size={20} style={{ color: "rgba(255,255,255,0.2)" }} />
                            </Box>
                        </Link>

                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            style={{
                                padding: "1.25rem 2rem",
                                background: "rgba(255, 77, 77, 0.05)",
                                borderRadius: "16px",
                                border: "1px solid rgba(255, 77, 77, 0.1)",
                                display: "flex",
                                justifyContent: "between",
                                alignItems: "center",
                                transition: "all 0.2s",
                                cursor: "pointer",
                                width: "100%",
                                textAlign: "left"
                            }} className="hover:bg-danger/10 active:scale-[0.99]">
                            <Stack direction="horizontal" gap={16} align="center">
                                <Box style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(255, 77, 77, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <LogOut size={20} color="#ff4d4d" />
                                </Box>
                                <Box>
                                    <Typography style={{ fontWeight: 700, color: "#ff4d4d" }}>Logga ut</Typography>
                                    <Typography style={{ fontSize: "0.85rem", color: "rgba(255, 77, 77, 0.4)" }}>Avsluta din session säkert</Typography>
                                </Box>
                            </Stack>
                            <ArrowRight size={20} style={{ color: "rgba(255, 77, 77, 0.2)" }} />
                        </button>
                    </Stack>
                </Stack>
            </Box>
        </SupportLayout>
    );
}
