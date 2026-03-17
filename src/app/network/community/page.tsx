"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { SupportLayout } from "@/components/layout/SupportLayout";
import { Box } from "@/components/layout/Box";
import { Stack } from "@/components/layout/Stack";
import { Typography } from "@/components/ui/typography";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { AvatarPreview } from "@/components/avatar-builder/AvatarPreview";
import MessageContent from "@/components/message-content";
import { ensureSupportInfrastructure } from "@/lib/actions/support";
import { MessageSquare, Users, Search } from "lucide-react";

interface Message {
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; name: string };
}

const SUPPORT_ROOMS = [
    { id: "community-general", name: "General Support", description: "A space for general help and sharing." },
    { id: "community-life", name: "Life Challenges", description: "Discussing the hurdles we face in life." },
    { id: "community-career", name: "Career Discussions", description: "Sharing insights on career growth and transitions." },
    { id: "community-growth", name: "Personal Growth", description: "Exploring ways to better ourselves." },
    { id: "community-intro", name: "Introductions", description: "Meet the community and share your story." },
];

export default function CommunityArea() {
    const { data: session } = useSession();
    const [activeRoomId, setActiveRoomId] = useState<string>("community-general");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [spaceId, setSpaceId] = useState<string | null>(null);
    const [initializing, setInitializing] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize infrastructure
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

    const fetchMessages = useCallback(async () => {
        if (!activeRoomId) return;
        setLoadingMessages(true);
        try {
            const res = await fetch(`/api/chat/messages?channelId=${activeRoomId}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            } else {
                setMessages([]);
            }
        } catch (err) {
            console.error("Failed to fetch messages:", err);
            setMessages([]);
        } finally {
            setLoadingMessages(false);
        }
    }, [activeRoomId]);

    useEffect(() => {
        if (!initializing) {
            fetchMessages();
        }
    }, [activeRoomId, fetchMessages, initializing]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || sending || !spaceId) return;

        setSending(true);
        const content = input.trim();
        setInput("");

        try {
            const res = await fetch("/api/chat/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    channelId: activeRoomId,
                    spaceId: spaceId,
                    content,
                }),
            });

            if (res.ok) {
                // Fetch latest to include the new one (and any others from real-time)
                fetchMessages();
            }
        } catch (err) {
            console.error("Send failed:", err);
        } finally {
            setSending(false);
        }
    };

    const activeRoom = SUPPORT_ROOMS.find((r) => r.id === activeRoomId);

    if (initializing) {
        return (
            <SupportLayout title="Community">
                <Box style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: "3rem", padding: "2rem" }}>
                    <Box>
                        <Skeleton height="24px" width="150px" style={{ marginBottom: "2rem" }} />
                        <Stack gap={16}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <Skeleton key={i} height="100px" borderRadius="20px" />
                            ))}
                        </Stack>
                    </Box>
                    <Box>
                        <Skeleton height="60px" width="300px" style={{ marginBottom: "2.5rem" }} />
                        <Skeleton height="400px" borderRadius="24px" />
                    </Box>
                </Box>
            </SupportLayout>
        );
    }

    return (
        <SupportLayout
            title="Community"
            subtitle="Connect with others who are on a similar journey. Share experiences and support each other in a safe space."
        >
            <Box style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: "3rem", height: "calc(100vh - 350px)" }}>
                {/* Rooms List */}
                <Box
                    style={{
                        borderRight: "1px solid rgba(255,255,255,0.1)",
                        paddingRight: "2.5rem",
                        overflowY: "auto",
                    }}
                    className="scrollbar-thin"
                >
                    <Typography
                        style={{
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.15em",
                            color: "rgba(255,255,255,0.4)",
                            marginBottom: "2rem",
                        }}
                    >
                        Community Rooms
                    </Typography>
                    <Stack gap={16}>
                        {SUPPORT_ROOMS.map((room) => (
                            <Box
                                key={room.id}
                                onClick={() => setActiveRoomId(room.id)}
                                style={{
                                    padding: "1.5rem",
                                    borderRadius: "20px",
                                    background: activeRoomId === room.id ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.02)",
                                    border: "1px solid",
                                    borderColor: activeRoomId === room.id ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)",
                                    cursor: "pointer",
                                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                }}
                                className="hover:bg-white/5 hover:border-white/10"
                            >
                                <Typography style={{ fontWeight: 700, fontSize: "1.15rem", fontFamily: "var(--font-outfit)" }}>
                                    {room.name}
                                </Typography>
                                <Typography style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.5)", marginTop: "0.5rem", lineHeight: 1.4 }}>
                                    {room.description}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>
                </Box>

                {/* Chat Area */}
                <Box style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                    {activeRoom ? (
                        <>
                            <Box style={{ marginBottom: "2.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                <Typography style={{ fontSize: "2rem", fontWeight: 700, fontFamily: "var(--font-outfit)" }}>
                                    {activeRoom.name}
                                </Typography>
                            </Box>

                            <Box style={{ flex: 1, overflowY: "auto", marginBottom: "2.5rem", paddingRight: "1.5rem" }} className="scrollbar-thin">
                                {loadingMessages && messages.length === 0 ? (
                                    <LoadingSpinner />
                                ) : messages.length === 0 ? (
                                    <EmptyState
                                        icon={MessageSquare}
                                        title="Här är det tyst"
                                        description="Bli den första att dela dina tankar eller ställa en fråga i detta rum."
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
                                                    <Box style={{ flex: 1 }}>
                                                        <Stack direction="horizontal" gap={12} align="center" style={{ marginBottom: "0.5rem" }}>
                                                            <Typography style={{ fontWeight: 700, fontSize: "1rem", color: "white" }}>
                                                                {msg.user.name}
                                                            </Typography>
                                                            <Typography style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)" }}>
                                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </Typography>
                                                        </Stack>
                                                        <Box style={{
                                                            color: "rgba(255,255,255,0.9)",
                                                            fontSize: "1.05rem",
                                                            lineHeight: 1.6,
                                                            background: "rgba(255,255,255,0.03)",
                                                            padding: "1rem 1.25rem",
                                                            borderRadius: "0 16px 16px 16px",
                                                            border: "1px solid rgba(255,255,255,0.05)"
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

                            <form onSubmit={handleSend} style={{ position: "relative" }}>
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={`Speak with the community in ${activeRoom.name}...`}
                                    disabled={sending}
                                    style={{
                                        width: "100%",
                                        padding: "1.5rem 2rem",
                                        borderRadius: "20px",
                                        background: "rgba(255,255,255,0.05)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        color: "white",
                                        fontFamily: "var(--font-inter)",
                                        fontSize: "1.1rem",
                                        outline: "none",
                                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                    }}
                                    className="focus:border-white/30 focus:bg-white/10"
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
                                        border: "none",
                                        color: "black",
                                        padding: "0.6rem 1.5rem",
                                        borderRadius: "12px",
                                        fontWeight: 800,
                                        fontSize: "0.9rem",
                                        cursor: "pointer",
                                        opacity: sending || !input.trim() ? 0.3 : 1,
                                        transition: "opacity 0.2s"
                                    }}
                                >
                                    Post
                                </button>
                            </form>
                        </>
                    ) : (
                        <Box style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                            <Typography style={{ color: "rgba(255,255,255,0.2)", fontSize: "1.25rem" }}>Select a space to enter the community</Typography>
                        </Box>
                    )}
                </Box>
            </Box>
        </SupportLayout>
    );
}
