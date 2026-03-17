"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { SupportLayout } from "@/components/layout/SupportLayout";
import { Box } from "@/components/layout/Box";
import { Stack } from "@/components/layout/Stack";
import { Typography } from "@/components/ui/typography";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import MessageContent from "@/components/message-content";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { AvatarPreview } from "@/components/avatar-builder/AvatarPreview";
import { Users, BookOpen, Shield, ArrowRight, X, Send, Search } from "lucide-react";
import { ensureSupportInfrastructure } from "@/lib/actions/support";

interface Message {
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; name: string };
}

const SUPPORT_GROUPS = [
    { id: "psych-anxiety", name: "Anxiety Support", description: "A gentle space to discuss managing anxiety in high-pressure environments.", members: 128, category: "Emotional Well-being" },
    { id: "psych-stress", name: "Stress Management", description: "Practical tools and shared experiences for navigating work-life stress.", members: 245, category: "Balance" },
    { id: "psych-transitions", name: "Life Transitions", description: "Support for navigating major changes, both personal and professional.", members: 89, category: "Growth" },
    { id: "psych-burnout", name: "Burnout Recovery", description: "A focused group for those recovering from or preventing burnout.", members: 167, category: "Recovery" },
];

const RESOURCES = [
    { title: "The Path to Resilience", type: "Guide", duration: "10 min read" },
    { title: "Mindful Engineering", type: "Workshop", duration: "45 min video" },
    { title: "Human-Centric Leadership", type: "Course", duration: "4 modules" },
];

export default function PsychologicalArea() {
    const { data: session } = useSession();
    const [initializing, setInitializing] = useState(true);
    const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [spaceId, setSpaceId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const init = async () => {
            const res = await ensureSupportInfrastructure();
            if (res.success) {
                setSpaceId(res.spaceId!);
            }
            setInitializing(false);
        };
        init();
    }, []);

    const fetchMessages = useCallback(async (channelId: string) => {
        setLoadingMessages(true);
        try {
            const res = await fetch(`/api/chat/messages?channelId=${channelId}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (err) {
            console.error("Failed to fetch group messages:", err);
        } finally {
            setLoadingMessages(false);
        }
    }, []);

    useEffect(() => {
        if (activeGroupId) {
            fetchMessages(activeGroupId);
        }
    }, [activeGroupId, fetchMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleJoinGroup = (groupId: string) => {
        setActiveGroupId(groupId);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || sending || !activeGroupId || !spaceId) return;

        setSending(true);
        const content = input.trim();
        setInput("");

        try {
            const res = await fetch("/api/chat/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    channelId: activeGroupId,
                    spaceId: spaceId,
                    content,
                }),
            });

            if (res.ok) {
                fetchMessages(activeGroupId);
            }
        } catch (err) {
            console.error("Send failed:", err);
        } finally {
            setSending(false);
        }
    };

    if (initializing) {
        return (
            <SupportLayout title="Psychological Support">
                <Box style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "4rem", padding: "2rem" }}>
                    <Box>
                        <Skeleton width="300px" height="32px" style={{ marginBottom: "1rem" }} />
                        <Skeleton width="100%" height="20px" style={{ marginBottom: "3rem" }} />
                        <Stack gap={24}>
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} height="120px" borderRadius="24px" />
                            ))}
                        </Stack>
                    </Box>
                    <Box>
                        <Skeleton height="400px" borderRadius="32px" />
                    </Box>
                </Box>
            </SupportLayout>
        );
    }

    const activeGroup = SUPPORT_GROUPS.find(g => g.id === activeGroupId);

    return (
        <SupportLayout
            title="Psychological Support"
            subtitle="Structured environments for shared healing and professional guidance. You are not alone on this journey."
        >
            <Box style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "4rem" }}>

                {/* Main Groups Column */}
                <Box>
                    <Box style={{ marginBottom: "3rem" }}>
                        <Typography style={{
                            fontSize: "1.75rem",
                            fontWeight: 700,
                            fontFamily: "var(--font-outfit)",
                            marginBottom: "1rem"
                        }}>
                            Support Groups
                        </Typography>
                        <Typography style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.1rem" }}>
                            Join a moderated space led by professionals and supported by peers.
                        </Typography>
                    </Box>

                    <Stack gap={24}>
                        {SUPPORT_GROUPS.map((group) => (
                            <Box
                                key={group.id}
                                style={{
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid rgba(255,255,255,0.05)",
                                    borderRadius: "24px",
                                    padding: "2rem",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "2rem",
                                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                }}
                                className="hover:bg-white/5 hover:border-white/10"
                            >
                                <Box style={{ flex: 1 }}>
                                    <Stack direction="horizontal" gap={12} align="center" style={{ marginBottom: "0.75rem" }}>
                                        <Users size={18} color="rgba(255,255,255,0.4)" />
                                        <Typography style={{ fontSize: "1.25rem", fontWeight: 700, fontFamily: "var(--font-outfit)" }}>
                                            {group.name}
                                        </Typography>
                                        <Box style={{
                                            background: "rgba(255,255,255,0.05)",
                                            padding: "2px 8px",
                                            borderRadius: "6px",
                                            fontSize: "0.75rem",
                                            color: "rgba(255,255,255,0.3)",
                                            fontWeight: 700
                                        }}>
                                            {group.members} MEMBERS
                                        </Box>
                                    </Stack>
                                    <Typography style={{ fontSize: "1rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
                                        {group.description}
                                    </Typography>
                                </Box>
                                <Box
                                    onClick={() => handleJoinGroup(group.id)}
                                    style={{
                                        background: "white",
                                        color: "black",
                                        padding: "0.75rem 1.5rem",
                                        borderRadius: "14px",
                                        fontWeight: 800,
                                        fontSize: "0.95rem",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                        flexShrink: 0
                                    }} className="hover:opacity-90 transition-opacity">
                                    Join Group
                                </Box>
                            </Box>
                        ))}
                    </Stack>
                </Box>

                {/* Resources Sidebar */}
                <Box>
                    <Box style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: "32px",
                        padding: "2rem",
                        marginBottom: "2rem"
                    }}>
                        <Stack gap={24}>
                            <Box>
                                <Stack direction="horizontal" gap={12} align="center" style={{ marginBottom: "1rem" }}>
                                    <BookOpen size={20} color="rgba(255,255,255,0.5)" />
                                    <Typography style={{ fontSize: "1.25rem", fontWeight: 700, fontFamily: "var(--font-outfit)" }}>
                                        Resources
                                    </Typography>
                                </Stack>
                                <Typography style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                                    Expert-guided materials to support your mental health journey.
                                </Typography>
                            </Box>

                            <Stack gap={16}>
                                {RESOURCES.map((res) => (
                                    <Box
                                        key={res.title}
                                        style={{
                                            padding: "1rem",
                                            borderRadius: "16px",
                                            background: "rgba(255,255,255,0.03)",
                                            border: "1px solid rgba(255,255,255,0.05)",
                                            cursor: "pointer"
                                        }}
                                        className="hover:bg-white/5 transition-colors"
                                    >
                                        <Typography style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.25rem" }}>{res.title}</Typography>
                                        <Stack direction="horizontal" gap={8} align="center">
                                            <Typography style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>{res.type}</Typography>
                                            <Box style={{ width: "3px", height: "3px", borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />
                                            <Typography style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>{res.duration}</Typography>
                                        </Stack>
                                    </Box>
                                ))}
                            </Stack>

                            <Box style={{
                                marginTop: "1rem",
                                padding: "1rem",
                                borderRadius: "16px",
                                background: "rgba(255,255,255,0.05)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                cursor: "pointer"
                            }} className="hover:bg-white/10 transition-colors">
                                <Typography style={{ fontSize: "0.9rem", fontWeight: 700 }}>Browse All</Typography>
                                <ArrowRight size={16} />
                            </Box>
                        </Stack>
                    </Box>

                    <Box style={{
                        background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%)",
                        borderRadius: "32px",
                        padding: "2rem",
                        textAlign: "center",
                        border: "1px solid rgba(255,255,255,0.05)"
                    }}>
                        <Shield size={32} color="rgba(255,255,255,0.2)" style={{ margin: "0 auto 1.5rem" }} />
                        <Typography style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                            All interactions in this area are private and moderated by certified professionals.
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Group Chat Overlay */}
            {activeGroupId && (
                <Box style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: "rgba(0,0,0,0.8)",
                    backdropFilter: "blur(10px)",
                    zIndex: 2000,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "2rem"
                }}>
                    <Box style={{
                        width: "100%",
                        maxWidth: "900px",
                        height: "100%",
                        maxHeight: "800px",
                        background: "#0a0a0a",
                        borderRadius: "40px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        position: "relative"
                    }}>
                        <Box style={{
                            padding: "2.5rem 3rem",
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}>
                            <Box>
                                <Typography style={{ fontSize: "2rem", fontWeight: 700, fontFamily: "var(--font-outfit)" }}>{activeGroup?.name}</Typography>
                                <Typography style={{ color: "rgba(255,255,255,0.4)" }}>{activeGroup?.category} support group</Typography>
                            </Box>
                            <Box
                                onClick={() => setActiveGroupId(null)}
                                style={{
                                    width: "48px",
                                    height: "48px",
                                    borderRadius: "16px",
                                    background: "rgba(255,255,255,0.05)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer"
                                }} className="hover:bg-white/10">
                                <X size={24} />
                            </Box>
                        </Box>

                        <Box style={{ flex: 1, overflowY: "auto", padding: "3rem" }} className="scrollbar-thin">
                            {loadingMessages ? (
                                <Box style={{ display: "flex", justifyContent: "center", paddingTop: "4rem" }}>
                                    <LoadingSpinner />
                                </Box>
                            ) : messages.length === 0 ? (
                                <EmptyState
                                    icon={Users}
                                    title="Välkommen till gruppen"
                                    description="Här kan du dela tankar och erfarenheter med andra i en trygg miljö."
                                />
                            ) : (
                                <Stack gap={32}>
                                    {messages.map((msg) => (
                                        <Box key={msg.id}>
                                            <Stack direction="horizontal" gap={16} align="start">
                                                <AvatarPreview
                                                    avatarId={(msg.user as any).avatarId}
                                                    name={msg.user.name}
                                                    size="sm"
                                                />
                                                <Box>
                                                    <Stack direction="horizontal" gap={12} align="center" style={{ marginBottom: "0.5rem" }}>
                                                        <Typography style={{ fontWeight: 700 }}>{msg.user.name}</Typography>
                                                        <Typography style={{ fontSize: "0.75rem", opacity: 0.3 }}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                                                    </Stack>
                                                    <Box style={{
                                                        background: "rgba(255,255,255,0.02)",
                                                        padding: "1rem 1.5rem",
                                                        borderRadius: "0 20px 20px 20px",
                                                        border: "1px solid rgba(255,255,255,0.05)",
                                                        fontSize: "1.05rem",
                                                        lineHeight: 1.6
                                                    }}>
                                                        <MessageContent content={msg.content} currentUserName={session?.user?.name || ""} />
                                                    </Box>
                                                </Box>
                                            </Stack>
                                        </Box>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </Stack>
                            )}
                        </Box>

                        <Box style={{ padding: "2.5rem 3rem", background: "rgba(255,255,255,0.02)" }}>
                            <form onSubmit={handleSend} style={{ position: "relative" }}>
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={`Share with ${activeGroup?.name}...`}
                                    disabled={sending}
                                    style={{
                                        width: "100%",
                                        padding: "1.5rem 2rem",
                                        borderRadius: "20px",
                                        background: "rgba(0,0,0,0.3)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        color: "white",
                                        fontSize: "1.1rem",
                                        outline: "none"
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={sending || !input.trim()}
                                    style={{
                                        position: "absolute",
                                        right: "1.25rem",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        background: "white",
                                        color: "black",
                                        padding: "0.6rem 1.5rem",
                                        borderRadius: "12px",
                                        fontWeight: 800,
                                        cursor: "pointer",
                                        opacity: sending || !input.trim() ? 0.3 : 1
                                    }}
                                >
                                    Share
                                </button>
                            </form>
                        </Box>
                    </Box>
                </Box>
            )}
        </SupportLayout>
    );
}
