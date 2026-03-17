"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { SupportLayout } from "@/components/layout/SupportLayout";
import { Box } from "@/components/layout/Box";
import { Stack } from "@/components/layout/Stack";
import { Typography } from "@/components/ui/typography";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Moon, Sun, Wind, Send, Share2 } from "lucide-react";
import { ensureSupportInfrastructure } from "@/lib/actions/support";

const REFLECTION_SPACES = [
    {
        id: "spirit-meditation",
        title: "Meditation Discussions",
        description: "Sharing techniques and experiences from daily practice.",
        icon: <Wind size={20} />,
        color: "rgba(100, 200, 255, 0.1)"
    },
    {
        id: "spirit-growth",
        title: "Inner Growth",
        description: "Exploring the journey of the self through personal challenges.",
        icon: <Sparkles size={20} />,
        color: "rgba(255, 200, 100, 0.1)"
    },
    {
        id: "spirit-philosophy",
        title: "Philosophy Conversations",
        description: "Deep dives into the questions that shape our worldview.",
        icon: <Moon size={20} />,
        color: "rgba(200, 100, 255, 0.1)"
    },
    {
        id: "spirit-mindfulness",
        title: "Mindfulness Practices",
        description: "Applying awareness to modern creation and technology.",
        icon: <Sun size={20} />,
        color: "rgba(100, 255, 200, 0.1)"
    },
];

export default function SpiritualArea() {
    const { data: session } = useSession();
    const [initializing, setInitializing] = useState(true);
    const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
    const [reflection, setReflection] = useState("");
    const [sharing, setSharing] = useState(false);
    const [spaceId, setSpaceId] = useState<string | null>(null);

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

    const handleShareReflection = async () => {
        if (!reflection.trim() || sharing || !activeSpaceId || !spaceId) return;

        setSharing(true);
        try {
            const res = await fetch("/api/chat/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    channelId: activeSpaceId,
                    spaceId: spaceId,
                    content: reflection.trim(),
                }),
            });

            if (res.ok) {
                alert("Your reflection has been shared with the community.");
                setReflection("");
            }
        } catch (err) {
            console.error("Failed to share reflection:", err);
        } finally {
            setSharing(false);
        }
    };

    if (initializing) {
        return (
            <SupportLayout title="Spiritual Reflection">
                <Box style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
                    <Box style={{ textAlign: "center", marginBottom: "5rem" }}>
                        <Skeleton height="60px" width="80%" style={{ margin: "0 auto" }} />
                    </Box>
                    <Box style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem" }}>
                        <Box>
                            <Skeleton width="200px" height="32px" style={{ marginBottom: "2.5rem" }} />
                            <Box style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                                {[1, 2, 3, 4].map(i => (
                                    <Skeleton key={i} height="180px" borderRadius="24px" />
                                ))}
                            </Box>
                        </Box>
                        <Box>
                            <Skeleton height="500px" borderRadius="32px" />
                        </Box>
                    </Box>
                </Box>
            </SupportLayout>
        );
    }

    const activeSpace = REFLECTION_SPACES.find(s => s.id === activeSpaceId);

    return (
        <SupportLayout
            title="Spiritual Reflection"
            subtitle="Explore inner practices and shared wisdom to deepen awareness and connect with your essence."
        >
            <Box style={{ maxWidth: "1200px", margin: "0 auto" }}>

                {/* Quote / Intro */}
                <Box style={{ textAlign: "center", marginBottom: "5rem", padding: "3rem", background: "radial-gradient(circle at center, rgba(255,255,255,0.03) 0%, transparent 80%)" }}>
                    <Typography style={{
                        fontSize: "2.5rem",
                        fontStyle: "italic",
                        fontFamily: "var(--font-outfit)",
                        lineHeight: 1.3,
                        color: "rgba(255,255,255,0.9)",
                        maxWidth: "800px",
                        margin: "0 auto"
                    }}>
                        "In the silence of the heart, one finds the strength to create."
                    </Typography>
                </Box>

                <Box style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem" }}>

                    {/* Spaces Grid */}
                    <Box>
                        <Typography style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "var(--font-outfit)", marginBottom: "2.5rem" }}>
                            Reflection Spaces
                        </Typography>
                        <Box style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                            {REFLECTION_SPACES.map((space) => (
                                <Box
                                    key={space.id}
                                    onClick={() => setActiveSpaceId(space.id)}
                                    style={{
                                        background: activeSpaceId === space.id ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                                        border: activeSpaceId === space.id ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.05)",
                                        borderRadius: "24px",
                                        padding: "2rem",
                                        cursor: "pointer",
                                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                    }}
                                    className="hover:bg-white/5 hover:-translate-y-1"
                                >
                                    <Box style={{
                                        width: "48px",
                                        height: "48px",
                                        borderRadius: "16px",
                                        background: space.color,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginBottom: "1.5rem",
                                        color: "rgba(255,255,255,0.8)"
                                    }}>
                                        {space.icon}
                                    </Box>
                                    <Typography style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.75rem", fontFamily: "var(--font-outfit)" }}>
                                        {space.title}
                                    </Typography>
                                    <Typography style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                                        {space.description}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {/* Interactive Share Area */}
                    <Box>
                        <Typography style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "var(--font-outfit)", marginBottom: "2.5rem" }}>
                            Share a Reflection
                        </Typography>

                        <Box style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.05)",
                            borderRadius: "32px",
                            padding: "2.5rem",
                            height: "fit-content"
                        }}>
                            <Typography style={{ fontSize: "1.1rem", marginBottom: "1.5rem", color: "rgba(255,255,255,0.7)" }}>
                                {activeSpaceId
                                    ? `What's on your mind regarding ${REFLECTION_SPACES.find(s => s.id === activeSpaceId)?.title}?`
                                    : "Select a space and share your thoughts with the community."}
                            </Typography>

                            <textarea
                                value={reflection}
                                onChange={(e) => setReflection(e.target.value)}
                                placeholder="Type your reflection here..."
                                style={{
                                    width: "100%",
                                    height: "150px",
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "20px",
                                    padding: "1.5rem",
                                    color: "white",
                                    fontFamily: "var(--font-inter)",
                                    fontSize: "1rem",
                                    resize: "none",
                                    outline: "none",
                                    marginBottom: "2rem",
                                    transition: "border-color 0.2s"
                                }}
                                className="focus:border-white/20"
                                disabled={!activeSpaceId || sharing}
                            />

                            <Box style={{ display: "flex", gap: "1rem" }}>
                                <Box
                                    onClick={handleShareReflection}
                                    style={{
                                        flex: 1,
                                        background: "white",
                                        color: "black",
                                        padding: "1rem",
                                        borderRadius: "16px",
                                        textAlign: "center",
                                        fontWeight: 800,
                                        cursor: activeSpaceId && reflection.trim() && !sharing ? "pointer" : "default",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "0.75rem",
                                        opacity: activeSpaceId && reflection.trim() && !sharing ? 1 : 0.3
                                    }} className={activeSpaceId && reflection.trim() && !sharing ? "hover:opacity-90 transition-opacity" : ""}>
                                    <Send size={18} />
                                    {sharing ? "Sharing..." : "Share to Space"}
                                </Box>
                                <Box style={{
                                    width: "56px",
                                    height: "56px",
                                    borderRadius: "16px",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    color: "rgba(255,255,255,0.5)"
                                }} className="hover:bg-white/5 transition-colors">
                                    <Share2 size={18} />
                                </Box>
                            </Box>
                        </Box>

                        <Box style={{ marginTop: "3rem", padding: "1.5rem", borderRadius: "20px", background: "rgba(255,200,100,0.03)", border: "1px solid rgba(255,200,100,0.1)" }}>
                            <Typography style={{ fontSize: "0.9rem", color: "rgba(255,200,100,0.7)", lineHeight: 1.5 }}>
                                Tip: Reflections shared here are posted to the public community board within each space to foster shared understanding.
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </SupportLayout>
    );
}
