"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { SupportLayout } from "@/components/layout/SupportLayout";
import { Box } from "@/components/layout/Box";
import { Stack } from "@/components/layout/Stack";
import { Typography } from "@/components/ui/typography";
import { AvatarPreview } from "@/components/avatar-builder/AvatarPreview";
import { Check, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { saveAvatarConfig } from "@/lib/actions/avatar";
import { Skeleton } from "@/components/ui/skeleton";

const CURATED_AVATARS = [
    { id: "/avatars/avatar-1.png", name: "Vänlig kvinna" },
    { id: "/avatars/avatar-2.png", name: "Snäll man" },
    { id: "/avatars/avatar-3.png", name: "Empatisk kvinna" },
    { id: "/avatars/avatar-4.png", name: "Modern man" },
    { id: "/avatars/avatar-5.png", name: "Förtroendeingivande man" },
    { id: "/avatars/avatar-6.png", name: "Lugn kvinna" },
    { id: "/avatars/avatar-7.png", name: "Stöttande man" },
    { id: "/avatars/avatar-8.png", name: "Energisk kvinna" },
    { id: "/avatars/avatar-9.png", name: "Vänlig man med glasögon" },
    // Temporarily repeating to fill the UI grid for premium feel
    { id: "/avatars/avatar-1.png", name: "Variation A" },
    { id: "/avatars/avatar-3.png", name: "Variation B" },
    { id: "/avatars/avatar-6.png", name: "Variation C" },
];

export default function AvatarPage() {
    const { data: session, update } = useSession();
    const [initializing, setInitializing] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (session?.user) {
            setSelectedId((session.user as any).avatarId || "default");
            // Simulate Coaches pattern loading
            const timer = setTimeout(() => {
                setInitializing(false);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [session]);

    const handleSave = async () => {
        if (!selectedId || saving) return;
        setSaving(true);
        try {
            const res = await saveAvatarConfig({ avatarId: selectedId });
            if (res.success) {
                await update(); // Refresh session
                router.push("/profile");
            }
        } catch (err) {
            console.error("Failed to save avatar:", err);
        } finally {
            setSaving(false);
        }
    };

    if (initializing) {
        return (
            <SupportLayout title="Välj din Avatar">
                <Box style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem" }}>
                    <Box style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "2rem" }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <Skeleton key={i} height="140px" borderRadius="24px" />
                        ))}
                    </Box>
                </Box>
            </SupportLayout>
        );
    }

    return (
        <SupportLayout
            title="Välj din Avatar"
            subtitle="Välj en avatar som bäst representerar den du vill vara i The Support Network."
            backHref="/profile"
        >
            <Box style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem 1rem" }}>
                <Stack gap={48}>
                    {/* Current Selection Preview */}
                    <Box style={{
                        textAlign: "center",
                        padding: "3rem",
                        background: "rgba(255,255,255,0.02)",
                        borderRadius: "32px",
                        border: "1px solid rgba(255,255,255,0.05)",
                        maxWidth: "400px",
                        margin: "0 auto"
                    }}>
                        <Box style={{ width: "160px", height: "160px", margin: "0 auto 1.5rem" }}>
                            <AvatarPreview
                                avatarId={selectedId || "default"}
                                name={session?.user?.name || ""}
                                size={160}
                            />
                        </Box>
                        <Typography style={{ fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.1em" }}>Förhandsvisning</Typography>
                    </Box>

                    {/* Selection Grid */}
                    <Box style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                        gap: "2rem"
                    }}>
                        {CURATED_AVATARS.map(avatar => (
                            <Box
                                key={avatar.id}
                                onClick={() => setSelectedId(avatar.id)}
                                style={{
                                    position: "relative",
                                    cursor: "pointer",
                                    padding: "20px",
                                    borderRadius: "24px",
                                    background: selectedId === avatar.id ? "rgba(0, 230, 118, 0.05)" : "rgba(255,255,255,0.02)",
                                    border: "2px solid",
                                    borderColor: selectedId === avatar.id ? "var(--neon-green)" : "rgba(255,255,255,0.05)",
                                    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
                                }}
                                className="hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <AvatarPreview avatarId={avatar.id} size="xl" />
                                {selectedId === avatar.id && (
                                    <Box style={{
                                        position: "absolute",
                                        top: "10px",
                                        right: "10px",
                                        background: "var(--neon-green)",
                                        color: "black",
                                        width: "24px",
                                        height: "24px",
                                        borderRadius: "50%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                    }}>
                                        <Check size={14} strokeWidth={4} />
                                    </Box>
                                )}
                            </Box>
                        ))}

                        {/* Initials Placeholder */}
                        <Box
                            onClick={() => setSelectedId("default")}
                            style={{
                                position: "relative",
                                cursor: "pointer",
                                padding: "20px",
                                borderRadius: "24px",
                                background: selectedId === "default" ? "rgba(0, 230, 118, 0.05)" : "rgba(255,255,255,0.02)",
                                border: "2px solid",
                                borderColor: selectedId === "default" ? "var(--neon-green)" : "rgba(255,255,255,0.05)",
                                transition: "all 0.2s",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                minHeight: "180px"
                            }}
                            className="hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Stack align="center" gap={12}>
                                <AvatarPreview avatarId="default" name={session?.user?.name || ""} size={80} />
                                <Typography style={{ fontSize: "0.85rem", fontWeight: 700, opacity: 0.4 }}>Initialer</Typography>
                            </Stack>
                            {selectedId === "default" && (
                                <Box style={{
                                    position: "absolute",
                                    top: "10px",
                                    right: "10px",
                                    background: "var(--neon-green)",
                                    color: "black",
                                    width: "24px",
                                    height: "24px",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}>
                                    <Check size={14} strokeWidth={4} />
                                </Box>
                            )}
                        </Box>
                    </Box>

                    {/* Sticky Footer Actions */}
                    <Box style={{
                        position: "sticky",
                        bottom: "2rem",
                        zIndex: 10,
                        display: "flex",
                        justifyContent: "center",
                        gap: "1rem",
                        padding: "1rem"
                    }}>
                        <Link href="/profile" style={{ textDecoration: "none" }}>
                            <Box style={{
                                padding: "1rem 2rem",
                                borderRadius: "16px",
                                background: "rgba(0,0,0,0.8)",
                                backdropFilter: "blur(10px)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "rgba(255,255,255,0.6)",
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                transition: "all 0.2s"
                            }} className="hover:text-white">
                                <ArrowLeft size={18} />
                                Tillbaka
                            </Box>
                        </Link>
                        <button
                            disabled={!selectedId || saving}
                            onClick={handleSave}
                            style={{
                                padding: "1rem 3rem",
                                borderRadius: "16px",
                                background: (selectedId && !saving) ? "var(--neon-green)" : "rgba(255,255,255,0.05)",
                                color: (selectedId && !saving) ? "black" : "rgba(255,255,255,0.2)",
                                fontWeight: 800,
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                border: "none",
                                cursor: (selectedId && !saving) ? "pointer" : "not-allowed",
                                transition: "all 0.2s",
                                fontSize: "1rem",
                                boxShadow: (selectedId && !saving) ? "0 10px 40px rgba(0, 230, 118, 0.3)" : "none"
                            }}
                            className={(selectedId && !saving) ? "hover:scale-105 active:scale-95" : ""}
                        >
                            {saving ? "Sparar..." : (
                                <>
                                    <Save size={18} />
                                    Spara Avatar
                                </>
                            )}
                        </button>
                    </Box>
                </Stack>
            </Box>
        </SupportLayout>
    );
}
