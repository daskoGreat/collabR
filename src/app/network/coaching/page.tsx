"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { SupportLayout } from "@/components/layout/SupportLayout";
import { Box } from "@/components/layout/Box";
import { Stack } from "@/components/layout/Stack";
import { Typography } from "@/components/ui/typography";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import MessageContent from "@/components/message-content";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Calendar, Star, ShieldCheck, X, Send, Search, Filter, ChevronDown, Clock, Users, Award, TrendingUp, CheckCircle2, MessageSquare, ArrowRight, Shield, Globe, Sparkles, Heart } from "lucide-react";
import { ensureSupportInfrastructure } from "@/lib/actions/support";

interface Message {
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; name: string };
}

interface Coach {
    id: string;
    name: string;
    role: string;
    bio: string;
    expertise: string[];
    availability: string;
    availabilityStatus: "available" | "limited" | "unavailable";
    rating: number;
    avatarUrl?: string;
    isOnline: boolean;
    yearsExperience: string;
    sessionsCompleted: number;
    responseTime: string;
}

const COACHES: Coach[] = [
    {
        id: "coach-1",
        name: "Dr. Elena Vance",
        role: "Senior Guiding Mentor",
        bio: "Specializing in career transitions and burnout recovery for technology professionals. Over 15 years of experience in human-centric leadership.",
        expertise: ["Career Growth", "Burnout Recovery", "Leadership"],
        availability: "Available tomorrow",
        availabilityStatus: "available",
        rating: 4.9,
        isOnline: true,
        yearsExperience: "15+ years",
        sessionsCompleted: 450,
        responseTime: "within 1 hour"
    },
    {
        id: "coach-2",
        name: "Marcus Aurelius",
        role: "Philosophy & Growth Coach",
        bio: "Focusing on stoic principles and internal resilience. Helping creators find balance between high-performance and inner peace.",
        expertise: ["Resilience", "Mindfulness", "Internal Balance"],
        availability: "Available today",
        availabilityStatus: "available",
        rating: 5.0,
        isOnline: false,
        yearsExperience: "20+ years",
        sessionsCompleted: 820,
        responseTime: "within 2 hours"
    },
    {
        id: "coach-3",
        name: "Sarah Chen",
        role: "Technical Wellness Guide",
        bio: "Bridging the gap between engineering pressure and mental well-being. Dedicated to helping developers thrive without sacrifice.",
        expertise: ["Stress Management", "Engineering Culture", "Wellness"],
        availability: "Available Friday",
        availabilityStatus: "limited",
        rating: 4.8,
        isOnline: true,
        yearsExperience: "8 years",
        sessionsCompleted: 120,
        responseTime: "within 15 mins"
    }
];

function MentorAvatar({ coach, size = 88 }: { coach: Coach; size?: number }) {
    const initials = coach.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const getGradient = (name: string) => {
        const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const gradients = [
            "linear-gradient(135deg, #f97316 0%, #ef4444 100%)", // orange -> coral
            "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)", // blue -> cyan
            "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)", // purple -> blue
        ];
        return gradients[hash % gradients.length];
    };

    return (
        <div style={{ position: "relative", width: `${size}px`, height: `${size}px`, marginBottom: "1.5rem" }}>
            <div style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                overflow: "hidden",
                background: coach.avatarUrl ? "transparent" : getGradient(coach.name),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid rgba(255,255,255,0.05)",
                boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
                position: "relative"
            }}>
                {coach.avatarUrl ? (
                    <img
                        src={coach.avatarUrl}
                        alt={coach.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                ) : (
                    <span style={{
                        color: "white",
                        fontSize: `${size * 0.35}px`,
                        fontWeight: 700,
                        fontFamily: "var(--font-outfit)"
                    }}>
                        {initials}
                    </span>
                )}
            </div>

            {/* Status Indicator */}
            <div style={{
                position: "absolute",
                bottom: "2px",
                right: "2px",
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: coach.isOnline ? "var(--neon-green)" : "#4B5563",
                border: "3px solid #16181c",
                boxShadow: coach.isOnline ? "0 0 10px var(--neon-green-glow)" : "none",
                zIndex: 2
            }} />
        </div>
    );
}

function VerificationBadge() {
    return (
        <Box style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            background: "rgba(0, 230, 118, 0.1)",
            padding: "2px 8px",
            borderRadius: "99px",
            border: "1px solid rgba(0, 230, 118, 0.2)"
        }}>
            <CheckCircle2 size={10} color="var(--neon-green)" />
            <span style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                color: "var(--neon-green)",
                textTransform: "uppercase",
                letterSpacing: "0.02em"
            }}>
                Verified Guide
            </span>
        </Box>
    );
}

export default function CoachingArea() {
    const { data: session } = useSession();
    const [initializing, setInitializing] = useState(true);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [activeCoachName, setActiveCoachName] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [spaceId, setSpaceId] = useState<string | null>(null);

    // Filter State
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedAvailability, setSelectedAvailability] = useState("Anytime");
    const [sortBy, setSortBy] = useState("Recommended");

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

    const fetchMessages = useCallback(async (threadId: string) => {
        setLoadingMessages(true);
        try {
            const res = await fetch(`/api/messages/messages?threadId=${threadId}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (err) {
            console.error("Failed to fetch DM messages:", err);
        } finally {
            setLoadingMessages(false);
        }
    }, []);

    useEffect(() => {
        if (activeThreadId) {
            fetchMessages(activeThreadId);
        }
    }, [activeThreadId, fetchMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleStartConversation = async (coachId: string, coachName: string) => {
        setSending(true);
        try {
            const res = await fetch("/api/messages/thread", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetUserId: coachId }),
            });

            if (res.ok) {
                const data = await res.json();
                setActiveThreadId(data.threadId);
                setActiveCoachName(coachName);
            }
        } catch (err) {
            console.error("Failed to start coaching conversation:", err);
        } finally {
            setSending(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || sending || !activeThreadId) return;

        setSending(true);
        const content = input.trim();
        setInput("");

        try {
            const res = await fetch("/api/messages/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    threadId: activeThreadId,
                    content,
                }),
            });

            if (res.ok) {
                fetchMessages(activeThreadId);
            }
        } catch (err) {
            console.error("Send failed:", err);
        } finally {
            setSending(false);
        }
    };

    const handleRequestSession = (coachId: string) => {
        // In a real app, this would create a Task or Calendar entry
        alert("Your guidance session request has been sent. The coach will get back to you shortly.");
    };

    const filteredCoaches = COACHES.filter(coach => {
        const matchesSearch = coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            coach.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
            coach.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
            coach.expertise.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = selectedCategory === "All" || coach.expertise.includes(selectedCategory);

        const matchesAvailability = selectedAvailability === "Anytime" ||
            (selectedAvailability === "Available now" && coach.isOnline) ||
            (selectedAvailability === "Available tomorrow" && coach.availability.includes("tomorrow")) ||
            (selectedAvailability === "This week" && (coach.availability.includes("today") || coach.availability.includes("tomorrow") || coach.availability.includes("Friday")));

        return matchesSearch && matchesCategory && matchesAvailability;
    }).sort((a, b) => {
        if (sortBy === "Highest rated") return b.rating - a.rating;
        if (sortBy === "Most experienced") return parseInt(b.yearsExperience) - parseInt(a.yearsExperience);
        if (sortBy === "Fastest response") return a.responseTime.includes("min") ? -1 : 1;
        return 0; // Recommended (default)
    });

    if (initializing) {
        return (
            <SupportLayout title="Coaching">
                <Box style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem" }}>
                    <Stack gap={32}>
                        {[1, 2, 3].map((i) => (
                            <Box key={i} style={{
                                background: "rgba(255,255,255,0.02)",
                                borderRadius: "24px",
                                padding: "2.5rem",
                                border: "1px solid rgba(255,255,255,0.05)"
                            }}>
                                <Box className="mentor-card-layout" style={{
                                    display: "grid",
                                    gridTemplateColumns: "140px 1fr 240px",
                                    gap: "2.5rem"
                                }}>
                                    <Stack gap={16} align="center">
                                        <Skeleton width="110px" height="110px" borderRadius="50%" />
                                        <Skeleton width="100px" height="18px" />
                                        <Skeleton width="80px" height="14px" />
                                    </Stack>
                                    <Box style={{ paddingTop: "0.5rem" }}>
                                        <Skeleton width="100%" height="20px" style={{ marginBottom: "12px" }} />
                                        <Skeleton width="90%" height="20px" style={{ marginBottom: "32px" }} />
                                        <Box style={{ display: "flex", gap: "12px" }}>
                                            <Skeleton width="70px" height="28px" borderRadius="99px" />
                                            <Skeleton width="90px" height="28px" borderRadius="99px" />
                                        </Box>
                                    </Box>
                                    <Skeleton width="100%" height="100%" borderRadius="20px" />
                                </Box>
                            </Box>
                        ))}
                    </Stack>
                </Box>
            </SupportLayout>
        );
    }

    return (
        <SupportLayout
            title="Mentorship & Coaching"
            subtitle="Connect with experienced guides who understand your journey. Personal support tailored to your growth."
        >
            <style dangerouslySetInnerHTML={{
                __html: `
                .mentor-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 2.5rem;
                }
                
                @media (min-width: 1600px) {
                    .mentor-grid {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }

                @media (max-width: 1280px) {
                    .mentor-grid {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 900px) {
                    .mentor-card-layout {
                        display: flex !important;
                        flex-direction: column !important;
                        gap: 2rem !important;
                    }
                    .identity-column {
                        width: 100% !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        text-align: center !important;
                    }
                    .content-column {
                        padding: 0 !important;
                        width: 100% !important;
                    }
                    .action-column {
                        width: 100% !important;
                        border-left: none !important;
                        padding-left: 0 !important;
                        padding-top: 2rem !important;
                        border-top: 1px solid rgba(255,255,255,0.05) !important;
                    }
                }

                .mentor-card {
                    background: #16181c !important;
                    border: 1px solid rgba(255,255,255,0.05) !important;
                    border-radius: 20px !important;
                    padding: 32px !important;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.2) !important;
                }

                .mentor-card:hover {
                    transform: translateY(-4px);
                    border-color: rgba(255,255,255,0.12) !important;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.4) !important;
                }

                .expertise-pill {
                    background: #1e2025 !important;
                    border: 1px solid rgba(255,255,255,0.08) !important;
                    padding: 6px 14px !important;
                    border-radius: 99px !important;
                    font-size: 0.75rem !important;
                    color: rgba(255,255,255,0.6) !important;
                    font-weight: 600 !important;
                }

                .filter-pill:hover {
                    background: rgba(255,255,255,0.08) !important;
                }

                input::placeholder {
                    color: rgba(255,255,255,0.2) !important;
                }
            `}} />

            <Box style={{ marginBottom: "6rem", textAlign: "center", paddingTop: "2rem" }}>
                <Typography style={{
                    fontSize: "3rem",
                    fontWeight: 800,
                    fontFamily: "var(--font-outfit)",
                    marginBottom: "1rem",
                    letterSpacing: "-0.03em",
                    color: "#ffffff"
                }}>
                    Available Guides
                </Typography>
                <Typography style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "1.25rem",
                    maxWidth: "600px",
                    margin: "0 auto",
                    lineHeight: 1.5
                }}>
                    Our coaches are carefully selected experts dedicated to human-centric guidance.
                </Typography>
            </Box>

            {/* Discovery Layer */}
            <Box style={{
                marginBottom: "3rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem"
            }}>
                <Box style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    background: "rgba(255,255,255,0.03)",
                    padding: "0.75rem 1.25rem",
                    borderRadius: "20px",
                    border: "1px solid rgba(255,255,255,0.05)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
                }}>
                    <Search size={20} style={{ color: "rgba(255,255,255,0.3)" }} />
                    <input
                        type="text"
                        placeholder="Search by name, expertise, or role..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            flex: 1,
                            background: "transparent",
                            border: "none",
                            color: "#ffffff",
                            fontSize: "1rem",
                            outline: "none",
                            fontFamily: "inherit"
                        }}
                    />
                    <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.1)", margin: "0 0.5rem" }} />
                    <button style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        background: "transparent",
                        border: "none",
                        color: "rgba(255,255,255,0.6)",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        cursor: "pointer"
                    }}>
                        <Filter size={16} />
                        Filters
                        <ChevronDown size={14} />
                    </button>
                </Box>

                <Box style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "1.5rem"
                }}>
                    <Box style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        {["All", "Career Growth", "Burnout Recovery", "Leadership", "Mindfulness", "Life Transitions", "Personal Growth"].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: "99px",
                                    fontSize: "0.85rem",
                                    fontWeight: 600,
                                    background: selectedCategory === cat ? "rgba(255,255,255,0.1)" : "transparent",
                                    color: selectedCategory === cat ? "#ffffff" : "rgba(255,255,255,0.4)",
                                    border: "1px solid",
                                    borderColor: selectedCategory === cat ? "rgba(255,255,255,0.15)" : "transparent",
                                    cursor: "pointer",
                                    transition: "all 0.2s"
                                }}
                                className="filter-pill"
                            >
                                {cat}
                            </button>
                        ))}
                    </Box>

                    <Box style={{ display: "flex", gap: "1rem" }}>
                        <select
                            value={selectedAvailability}
                            onChange={(e) => setSelectedAvailability(e.target.value)}
                            style={{
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.05)",
                                color: "rgba(255,255,255,0.6)",
                                padding: "8px 16px",
                                borderRadius: "12px",
                                fontSize: "0.85rem",
                                outline: "none",
                                cursor: "pointer"
                            }}
                        >
                            <option value="Anytime">Anytime</option>
                            <option value="Available now">Available now</option>
                            <option value="Available tomorrow">Available tomorrow</option>
                            <option value="This week">This week</option>
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={{
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.05)",
                                color: "rgba(255,255,255,0.6)",
                                padding: "8px 16px",
                                borderRadius: "12px",
                                fontSize: "0.85rem",
                                outline: "none",
                                cursor: "pointer"
                            }}
                        >
                            <option value="Recommended">Recommended</option>
                            <option value="Highest rated">Highest rated</option>
                            <option value="Most experienced">Most experienced</option>
                            <option value="Fastest response">Fastest response</option>
                        </select>
                    </Box>
                </Box>
            </Box>

            <Box className="mentor-grid">
                {filteredCoaches.length > 0 ? filteredCoaches.map((coach) => (
                    <Box key={coach.id} className="mentor-card">
                        <Box className="mentor-card-layout" style={{
                            display: "flex",
                            height: "100%",
                            alignItems: "stretch"
                        }}>
                            {/* COL 1: Identity (240px) */}
                            <Box className="identity-column" style={{
                                width: "240px",
                                flexShrink: 0,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start"
                            }}>
                                <MentorAvatar coach={coach} size={88} />
                                <Stack gap={8}>
                                    <Typography style={{
                                        fontSize: "1.25rem",
                                        fontWeight: 800,
                                        fontFamily: "var(--font-outfit)",
                                        color: "white",
                                        lineHeight: 1.1
                                    }}>
                                        {coach.name}
                                    </Typography>
                                    <Typography style={{
                                        fontSize: "0.85rem",
                                        color: "rgba(255,255,255,0.4)",
                                        fontWeight: 600,
                                        lineHeight: 1.3
                                    }}>
                                        {coach.role}
                                    </Typography>
                                    <Box style={{ marginTop: "0.5rem" }}>
                                        <VerificationBadge />
                                    </Box>
                                </Stack>
                            </Box>

                            {/* COL 2: Expertise & Description (Flex) */}
                            <Box className="content-column" style={{
                                flex: 1,
                                padding: "0 2rem",
                                display: "flex",
                                flexDirection: "column",
                                gap: "1.5rem"
                            }}>
                                <Typography style={{
                                    fontSize: "1.05rem",
                                    color: "rgba(255,255,255,0.7)",
                                    lineHeight: 1.6,
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden"
                                }}>
                                    {coach.bio}
                                </Typography>

                                <Box style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                                    {coach.expertise.map((exp) => (
                                        <span key={exp} className="expertise-pill">
                                            {exp}
                                        </span>
                                    ))}
                                </Box>

                                {/* Trust Metadata */}
                                <Box style={{
                                    marginTop: "auto",
                                    display: "flex",
                                    gap: "1.25rem",
                                    paddingTop: "1rem"
                                }}>
                                    <Stack direction="horizontal" gap={6} align="center">
                                        <Award size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
                                        <Typography style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
                                            {coach.yearsExperience}
                                        </Typography>
                                    </Stack>
                                    <Stack direction="horizontal" gap={6} align="center">
                                        <Users size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
                                        <Typography style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
                                            {coach.sessionsCompleted} sessions
                                        </Typography>
                                    </Stack>
                                    <Stack direction="horizontal" gap={6} align="center">
                                        <Clock size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
                                        <Typography style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
                                            {coach.responseTime}
                                        </Typography>
                                    </Stack>
                                </Box>
                            </Box>

                            {/* COL 3: Actions & Trust (220px) */}
                            <Box className="action-column" style={{
                                width: "220px",
                                flexShrink: 0,
                                borderLeft: "1px solid rgba(255,255,255,0.05)",
                                paddingLeft: "2rem",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between"
                            }}>
                                <Box>
                                    <Box style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                                        <Stack direction="horizontal" gap={4} align="center">
                                            <Star size={16} fill="#FFC107" color="#FFC107" />
                                            <Typography style={{ fontWeight: 800, fontSize: "1.1rem" }}>{coach.rating}</Typography>
                                        </Stack>
                                    </Box>
                                    <Box style={{
                                        fontSize: "0.75rem",
                                        fontWeight: 700,
                                        padding: "6px 12px",
                                        borderRadius: "99px",
                                        display: "inline-block",
                                        background: coach.availabilityStatus === "available" ? "rgba(0, 230, 118, 0.1)" : coach.availabilityStatus === "limited" ? "rgba(255, 167, 38, 0.1)" : "rgba(255,255,255,0.05)",
                                        color: coach.availabilityStatus === "available" ? "var(--neon-green)" : coach.availabilityStatus === "limited" ? "#FFA726" : "rgba(255,255,255,0.4)",
                                        border: "1px solid rgba(255,255,255,0.03)"
                                    }}>
                                        {coach.availability}
                                    </Box>
                                </Box>

                                <Stack gap={12} style={{ marginTop: "2rem" }}>
                                    <button
                                        onClick={() => handleStartConversation(coach.id, coach.name)}
                                        disabled={sending && activeCoachName === coach.name}
                                        style={{
                                            background: "var(--neon-green)",
                                            color: "black",
                                            padding: "0.85rem",
                                            borderRadius: "12px",
                                            fontWeight: 800,
                                            fontSize: "0.9rem",
                                            cursor: "pointer",
                                            border: "none",
                                            width: "100%",
                                            transition: "all 0.2s"
                                        }} className="hover:opacity-90 active:scale-[0.98]">
                                        Start Conversation
                                    </button>
                                    <button
                                        onClick={() => handleRequestSession(coach.id)}
                                        style={{
                                            background: "transparent",
                                            color: "white",
                                            padding: "0.85rem",
                                            borderRadius: "12px",
                                            fontWeight: 700,
                                            fontSize: "0.9rem",
                                            cursor: "pointer",
                                            border: "1px solid rgba(255,255,255,0.15)",
                                            width: "100%",
                                            transition: "all 0.2s"
                                        }} className="hover:bg-white/5 active:scale-[0.98]">
                                        Request Session
                                    </button>
                                </Stack>
                            </Box>
                        </Box>
                    </Box>
                )) : (
                    <Box style={{
                        gridColumn: "1 / -1",
                        padding: "6rem 2rem",
                        textAlign: "center",
                        background: "rgba(255,255,255,0.02)",
                        borderRadius: "20px",
                        border: "2px dashed rgba(255,255,255,0.05)"
                    }}>
                        <Typography style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>No guides matched your filters.</Typography>
                        <Typography style={{ color: "rgba(255,255,255,0.4)" }}>Try adjusting your search to discover more support options.</Typography>
                    </Box>
                )}
            </Box>

            {/* Chat Drawer Overlay */}
            {activeThreadId && (
                <Box style={{
                    position: "fixed",
                    bottom: "2rem",
                    right: "2rem",
                    width: "450px",
                    height: "600px",
                    background: "#111111",
                    borderRadius: "32px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
                    display: "flex",
                    flexDirection: "column",
                    zIndex: 1000,
                    overflow: "hidden"
                }}>
                    {/* Chat Header */}
                    <Box style={{
                        padding: "1.5rem 2rem",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: "rgba(255,255,255,0.02)"
                    }}>
                        <Stack direction="horizontal" gap={12} align="center">
                            <Box style={{ width: "32px", height: "32px", borderRadius: "10px", background: "rgba(255,255,255,0.1)" }}>
                                {/* Small avatar */}
                            </Box>
                            <Typography style={{ fontWeight: 700, fontSize: "1.1rem" }}>{activeCoachName}</Typography>
                        </Stack>
                        <Box
                            onClick={() => { setActiveThreadId(null); setActiveCoachName(null); }}
                            style={{ cursor: "pointer", opacity: 0.5 }} className="hover:opacity-100">
                            <X size={20} />
                        </Box>
                    </Box>

                    {/* Chat Messages */}
                    <Box style={{ flex: 1, overflowY: "auto", padding: "2rem" }} className="scrollbar-thin">
                        {loadingMessages ? (
                            <Box style={{ display: "flex", justifyContent: "center", paddingTop: "2rem" }}>
                                <LoadingSpinner />
                            </Box>
                        ) : messages.length === 0 ? (
                            <Box style={{ textAlign: "center", opacity: 0.3, paddingTop: "4rem" }}>
                                <MessageCircle size={48} style={{ margin: "0 auto 1rem" }} />
                                <Typography>Start your journey with {activeCoachName}</Typography>
                            </Box>
                        ) : (
                            <Stack gap={24}>
                                {messages.map((msg) => (
                                    <Box key={msg.id} style={{
                                        alignSelf: msg.user.id === session?.user?.id ? "flex-end" : "flex-start",
                                        maxWidth: "85%"
                                    }}>
                                        <Box style={{
                                            background: msg.user.id === session?.user?.id ? "white" : "rgba(255,255,255,0.05)",
                                            color: msg.user.id === session?.user?.id ? "black" : "white",
                                            padding: "1rem 1.25rem",
                                            borderRadius: msg.user.id === session?.user?.id ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                                        }}>
                                            <MessageContent content={msg.content} currentUserName={session?.user?.name || ""} />
                                        </Box>
                                        <Typography style={{
                                            fontSize: "0.75rem",
                                            opacity: 0.3,
                                            marginTop: "0.5rem",
                                            textAlign: msg.user.id === session?.user?.id ? "right" : "left"
                                        }}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Typography>
                                    </Box>
                                ))}
                                <div ref={messagesEndRef} />
                            </Stack>
                        )}
                    </Box>

                    {/* Chat Input */}
                    <Box style={{ padding: "1.5rem 2rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <form onSubmit={handleSend} style={{ position: "relative" }}>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your message..."
                                disabled={sending}
                                style={{
                                    width: "100%",
                                    padding: "1rem 3.5rem 1rem 1.5rem",
                                    borderRadius: "16px",
                                    background: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    color: "white",
                                    outline: "none"
                                }}
                            />
                            <button
                                type="submit"
                                disabled={sending || !input.trim()}
                                style={{
                                    position: "absolute",
                                    right: "0.75rem",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "transparent",
                                    border: "none",
                                    color: "white",
                                    cursor: "pointer",
                                    opacity: sending || !input.trim() ? 0.3 : 1
                                }}
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    </Box>
                </Box>
            )}

            <Box style={{ marginTop: "5rem", textAlign: "center", opacity: 0.3 }}>
                <Typography style={{ fontSize: "0.9rem" }}>Can't find what you're looking for? Contact support for a personal recommendation.</Typography>
            </Box>
        </SupportLayout>
    );
}
