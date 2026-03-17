"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import {
    Activity,
    Globe,
    Bell,
    MessageSquare,
    Users,
    Layout,
    Building2,
    ShieldCheck,
    Cpu,
    MessageCircle,
    ArrowRight
} from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Grid, GridItem } from "@/components/layout/Grid";
import { Stack } from "@/components/layout/Stack";
import { Typography } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AvatarPreview } from "@/components/avatar-builder/AvatarPreview";
import { Box } from "@/components/layout/Box";
import { getDashboardData } from "@/lib/actions/dashboard";
import { useRouter, useSearchParams } from "next/navigation";

export default function NetworkOverviewPage() {
    const { data: session, status } = useSession();
    const [initializing, setInitializing] = useState(true);
    const [data, setData] = useState<any>(null);
    const searchParams = useSearchParams();
    const router = useRouter();
    const view = searchParams.get("view") || "dashboard";

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await getDashboardData();
                if (res && 'success' in res) {
                    setData(res);
                }
            } catch (err) {
                console.error("Dashboard failed to load:", err);
            } finally {
                // Architectural pattern: consistent loading time
                setTimeout(() => setInitializing(false), 800);
            }
        }
        if (status === "authenticated") {
            fetchData();
        } else if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    if (status === "loading" || initializing) {
        return <DashboardSkeleton />;
    }

    if (!data?.user) return null;

    const { user, spaceIds, onlineUsers, latestHelp, collaborations } = data;

    return (
        <Container style={{ paddingBottom: '4rem', paddingTop: '2rem' }}>
            <Stack direction="vertical" gap={48}>
                {/* 🏗️ HEADER BLOCK */}
                <Box>
                    <Stack direction="vertical" gap={16}>
                        <Stack direction="vertical" gap={4}>
                            <Typography style={{ color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em" }}>
                                Your Support Network
                            </Typography>
                            <Typography style={{ fontSize: "min(3rem, 8vw)", fontWeight: 700, fontFamily: "var(--font-outfit)", lineHeight: 1.1 }}>
                                Hello {user.name.split(" ")[0]}, we are glad you are here.
                            </Typography>
                        </Stack>

                        <Stack direction="horizontal" gap={24} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px" }}>
                            <Link href="/spaces?view=dashboard" className="nav-link" style={{
                                padding: "8px 0",
                                textDecoration: "none",
                                borderBottom: view === "dashboard" ? "2px solid var(--neon-green)" : "2px solid transparent",
                                transition: "all 0.2s"
                            }}>
                                <Typography style={{ fontSize: "0.9rem", fontWeight: 600, color: view === "dashboard" ? "white" : "rgba(255,255,255,0.4)" }}>Overview</Typography>
                            </Link>
                            <Link href="/spaces?view=collaborations" className="nav-link" style={{
                                padding: "8px 0",
                                textDecoration: "none",
                                borderBottom: view === "collaborations" ? "2px solid var(--neon-green)" : "2px solid transparent",
                                transition: "all 0.2s"
                            }}>
                                <Typography style={{ fontSize: "0.9rem", fontWeight: 600, color: view === "collaborations" ? "white" : "rgba(255,255,255,0.4)" }}>Collaborations</Typography>
                            </Link>
                            <Link href="/spaces?view=pulse" className="nav-link" style={{
                                padding: "8px 0",
                                textDecoration: "none",
                                borderBottom: view === "pulse" ? "2px solid var(--neon-green)" : "2px solid transparent",
                                transition: "all 0.2s"
                            }}>
                                <Typography style={{ fontSize: "0.9rem", fontWeight: 600, color: view === "pulse" ? "white" : "rgba(255,255,255,0.4)" }}>Pulse</Typography>
                            </Link>
                            <Link href="/spaces?view=offices" className="nav-link" style={{
                                padding: "8px 0",
                                textDecoration: "none",
                                borderBottom: view === "offices" ? "2px solid var(--neon-green)" : "2px solid transparent",
                                transition: "all 0.2s"
                            }}>
                                <Typography style={{ fontSize: "0.9rem", fontWeight: 600, color: view === "offices" ? "white" : "rgba(255,255,255,0.4)" }}>Offices</Typography>
                            </Link>
                        </Stack>
                    </Stack>
                </Box>

                {/* 🧱 12-COLUMN DASHBOARD GEOMETRY */}
                <Box style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "2rem" }}>
                    {/* ⬅️ PRIMARY CONTENT (8/12) */}
                    <Box style={{ gridColumn: "span 8" }}>
                        {view === "dashboard" && (
                            <DashboardView
                                user={user}
                                mentions={user.mentions}
                                latestHelp={latestHelp}
                            />
                        )}
                        {view === "collaborations" && <CollaborationsView collaborations={collaborations} />}
                        {view === "pulse" && <PulseView latestHelp={latestHelp} />}
                        {view === "offices" && <OfficesView memberships={user.spaceMemberships} />}
                    </Box>

                    {/* ➡️ SYSTEM COLUMN (4/12) */}
                    <Box style={{ gridColumn: "span 4" }}>
                        <Stack direction="vertical" gap={24}>
                            {/* PANEL 1: PRESENCE */}
                            <Card style={{ padding: "1.5rem", borderRadius: "24px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                                <Stack direction="vertical" gap={16}>
                                    <Stack direction="horizontal" justify="between" align="center">
                                        <Typography style={{ fontWeight: 700, fontSize: "1.1rem" }}>Presence</Typography>
                                        <Box style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--neon-green)', boxShadow: '0 0 12px var(--neon-green)' }} />
                                    </Stack>

                                    <Stack direction="vertical" gap={8}>
                                        {onlineUsers.length === 0 ? (
                                            <Typography style={{ color: "rgba(255,255,255,0.3)", fontStyle: "italic", fontSize: "0.9rem" }}>No active nodes</Typography>
                                        ) : (
                                            onlineUsers.map((u: any) => (
                                                <Stack key={u.id} direction="horizontal" gap={12} align="center">
                                                    <Box style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--neon-green)', opacity: 0.4 }} />
                                                    <Typography style={{ fontSize: "0.85rem", fontWeight: 600, color: "white" }}>{u.name}</Typography>
                                                </Stack>
                                            ))
                                        )}
                                    </Stack>
                                </Stack>
                            </Card>

                            {/* PANEL 2: NETWORK STATUS */}
                            <Card style={{ padding: "1.5rem", borderRadius: "24px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                                <Stack direction="vertical" gap={12}>
                                    <Typography style={{ fontWeight: 700, fontSize: "1.1rem" }}>Network Status</Typography>
                                    <Typography style={{ fontSize: '0.9rem', color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                                        The network is active and stable. People are helping each other move forward.
                                    </Typography>
                                </Stack>
                            </Card>

                            {/* PANEL 3: QUOTE/INSIGHT */}
                            <Card style={{ padding: "1.5rem", borderRadius: "24px", background: "rgba(0, 230, 118, 0.05)", border: "1px solid rgba(0, 230, 118, 0.1)" }}>
                                <Stack gap={16}>
                                    <Box style={{ opacity: 0.8 }}>
                                        <img src="/heart.png" alt="Heart" style={{ width: '32px', height: 'auto' }} />
                                    </Box>
                                    <Typography style={{ fontStyle: 'italic', fontSize: '0.95rem', fontWeight: 500, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
                                        "A place where people help each other move forward."
                                    </Typography>
                                </Stack>
                            </Card>
                        </Stack>
                    </Box>
                </Box>
            </Stack>
            <style jsx global>{`
                .nav-link:hover Typography { color: white !important; }
                .item-card:hover { transform: translateX(8px); background: rgba(255,255,255,0.04) !important; border-color: rgba(255,255,255,0.1) !important; }
            `}</style>
        </Container>
    );
}

function DashboardView({ mentions, latestHelp }: any) {
    return (
        <Stack direction="vertical" gap={32}>
            {/* CARD 1: CURRENT FOCUS */}
            <Card style={{ borderRadius: "24px", overflow: "hidden", background: "#16181c", border: "1px solid rgba(255,255,255,0.05)" }}>
                <Box style={{ padding: "1.5rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <Typography style={{ fontWeight: 700, fontSize: "1.25rem" }}>Current Focus</Typography>
                    <Typography style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>Notifications & mentions</Typography>
                </Box>

                <Box>
                    {mentions.length === 0 ? (
                        <Box style={{ padding: '3rem', textAlign: 'center' }}>
                            <Typography style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>No new activity analyzed.</Typography>
                        </Box>
                    ) : (
                        <Stack gap={0}>
                            {mentions.map((m: any, i: number) => (
                                <Link key={m.id} href={
                                    m.message ? `/spaces/${m.message.channel.spaceId}/chat/${m.message.channelId}` :
                                        m.directMessage ? `/messages/${m.directMessage.threadId}` :
                                            m.post ? `/spaces/${m.post.spaceId}/help/${m.post.id}` : "#"
                                }
                                    style={{ textDecoration: "none", color: "inherit" }}
                                >
                                    <Box style={{ padding: '1.25rem 2rem', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.03)' : 'none', transition: 'all 0.2s' }} className="item-card">
                                        <Stack gap={8}>
                                            <Stack direction="horizontal" justify="between" align="center">
                                                <Typography style={{ color: 'var(--neon-green)', fontWeight: 800, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                                    {m.message ? "channel" : m.directMessage ? "dm" : "help"}
                                                </Typography>
                                                <Typography style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>
                                                    {formatDistanceToNow(new Date(m.createdAt), { locale: sv })}
                                                </Typography>
                                            </Stack>
                                            <Typography style={{ fontWeight: 500, color: "white" }}>
                                                {m.message && <span>Mention in <strong style={{ color: 'white' }}>#{m.message.channel.name}</strong></span>}
                                                {m.directMessage && <span>New reply in direct chat</span>}
                                                {m.post && <span>New reply in {m.post.title.toLowerCase()}</span>}
                                            </Typography>
                                        </Stack>
                                    </Box>
                                </Link>
                            ))}
                        </Stack>
                    )}
                </Box>
            </Card>

            {/* CARD 2: NETWORK PULSE */}
            <Card style={{ borderRadius: "24px", overflow: "hidden", background: "#16181c", border: "1px solid rgba(255,255,255,0.05)" }}>
                <Box style={{ padding: "1.5rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <Typography style={{ fontWeight: 700, fontSize: "1.25rem" }}>Network Pulse</Typography>
                    <Typography style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>Requests for support</Typography>
                </Box>

                <Box>
                    {latestHelp.length === 0 ? (
                        <Box style={{ padding: '3rem', textAlign: 'center' }}>
                            <Typography style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>No active requests.</Typography>
                        </Box>
                    ) : (
                        <Stack gap={0}>
                            {latestHelp.slice(0, 3).map((post: any, i: number) => (
                                <Link key={post.id} href={`/spaces/${post.spaceId}/help/${post.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                                    <Box style={{ padding: '1.25rem 2rem', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.03)' : 'none', transition: 'all 0.2s' }} className="item-card">
                                        <Stack gap={8}>
                                            <Stack direction="horizontal" gap={8} align="center">
                                                <Box style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff9800' }} />
                                                <Typography style={{ color: '#ff9800', fontWeight: 800, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>#{post.space.name}</Typography>
                                            </Stack>
                                            <Typography style={{ fontWeight: 600, fontSize: "1.1rem", color: "white" }}>{post.title}</Typography>
                                            <Typography style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>Posted by {post.user.name}</Typography>
                                        </Stack>
                                    </Box>
                                </Link>
                            ))}
                        </Stack>
                    )}
                </Box>
            </Card>
        </Stack>
    );
}

function CollaborationsView({ collaborations }: any) {
    return (
        <Stack direction="vertical" gap={24}>
            <Typography style={{ fontWeight: 700, fontSize: "1.5rem" }}>Active Collaborations</Typography>
            <Box style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
                {collaborations.map((space: any) => (
                    <Link key={space.id} href={`/spaces/${space.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                        <Card style={{
                            padding: "2rem",
                            borderRadius: "24px",
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.05)",
                            height: "100%",
                            transition: "all 0.2s"
                        }} className="hover:border-white/10 hover:bg-white/[0.04]">
                            <Stack direction="vertical" gap={12}>
                                <Typography style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>{space.channels.length} channels</Typography>
                                <Typography style={{ fontWeight: 700, fontSize: "1.4rem", color: "white" }}>{space.name}</Typography>
                                <Stack direction="horizontal" gap={0} style={{ marginTop: "1rem" }}>
                                    {space.members.map((m: any, i: number) => (
                                        <Box key={m.userId} style={{
                                            marginLeft: i > 0 ? '-10px' : '0',
                                            zIndex: 5 - i,
                                            borderRadius: '50%',
                                            border: '2px solid #000',
                                            overflow: 'hidden'
                                        }}>
                                            <AvatarPreview
                                                avatarId={m.user.avatarId}
                                                name={m.user.name}
                                                size="xs"
                                            />
                                        </Box>
                                    ))}
                                </Stack>
                            </Stack>
                        </Card>
                    </Link>
                ))}
            </Box>
        </Stack>
    );
}

function PulseView({ latestHelp }: any) {
    return (
        <Stack direction="vertical" gap={24}>
            <Typography style={{ fontWeight: 700, fontSize: "1.5rem" }}>Network Pulse (Support Feed)</Typography>
            <Stack gap={16}>
                {latestHelp.map((post: any) => (
                    <Link key={post.id} href={`/spaces/${post.spaceId}/help/${post.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                        <Card style={{
                            padding: "2rem",
                            borderRadius: "24px",
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.05)",
                            transition: "all 0.2s"
                        }} className="hover:border-white/10 hover:bg-white/[0.04]">
                            <Stack gap={12}>
                                <Stack direction="horizontal" justify="between">
                                    <Typography style={{ color: '#ff9800', fontWeight: 800, fontSize: "0.65rem", textTransform: "uppercase" }}>#{post.space.name}</Typography>
                                    <Typography style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>
                                        {formatDistanceToNow(new Date(post.createdAt), { locale: sv })}
                                    </Typography>
                                </Stack>
                                <Typography style={{ fontWeight: 700, fontSize: "1.3rem", color: "white" }}>{post.title}</Typography>
                                <Typography style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>by {post.user.name}</Typography>
                            </Stack>
                        </Card>
                    </Link>
                ))}
            </Stack>
        </Stack>
    );
}

function OfficesView({ memberships }: any) {
    return (
        <Stack direction="vertical" gap={24}>
            <Typography style={{ fontWeight: 700, fontSize: "1.5rem" }}>Offices</Typography>
            <Box style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
                {memberships.map((m: any) => (
                    <Link key={m.space.id} href={`/spaces/${m.space.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                        <Card style={{
                            padding: "2rem",
                            borderRadius: "24px",
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.05)",
                            height: "100%",
                            transition: "all 0.2s"
                        }} className="hover:border-white/10 hover:bg-white/[0.04]">
                            <Stack gap={12}>
                                <Typography style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Virtual Office</Typography>
                                <Typography style={{ fontWeight: 700, fontSize: "1.3rem", color: "white" }}>{m.space.name}</Typography>
                                <Typography style={{ color: 'var(--neon-green)', fontWeight: 800, fontSize: "0.65rem", marginTop: "auto", textTransform: "uppercase" }}>Status: Active</Typography>
                            </Stack>
                        </Card>
                    </Link>
                ))}
            </Box>
        </Stack>
    );
}

function DashboardSkeleton() {
    return (
        <Container style={{ paddingBottom: '4rem', paddingTop: '2rem' }}>
            <Stack gap={48}>
                <Box>
                    <Skeleton width="200px" height="16px" style={{ marginBottom: "12px" }} />
                    <Skeleton width="500px" height="48px" />
                </Box>
                <Box style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "2rem" }}>
                    <Box style={{ gridColumn: "span 8" }}>
                        <Stack gap={32}>
                            <Skeleton height="300px" borderRadius="24px" />
                            <Skeleton height="300px" borderRadius="24px" />
                        </Stack>
                    </Box>
                    <Box style={{ gridColumn: "span 4" }}>
                        <Stack gap={24}>
                            <Skeleton height="150px" borderRadius="24px" />
                            <Skeleton height="150px" borderRadius="24px" />
                        </Stack>
                    </Box>
                </Box>
            </Stack>
        </Container>
    );
}
