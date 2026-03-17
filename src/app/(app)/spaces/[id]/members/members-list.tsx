"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AvatarPreview } from "@/components/avatar-builder/AvatarPreview";
import { Box } from "@/components/layout/Box";
import { Stack } from "@/components/layout/Stack";
import { Typography } from "@/components/ui/typography";
import { MessageSquare } from "lucide-react";

interface Member {
    id: string;
    name: string;
    role: string;
    avatarId?: string;
}

interface Props {
    members: Member[];
    currentUserId: string;
    spaceName: string;
}

export default function MembersList({ members, currentUserId, spaceName }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);

    async function startDm(targetUserId: string) {
        setLoading(targetUserId);
        try {
            const res = await fetch("/api/messages/thread", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetUserId }),
            });
            if (res.ok) {
                const data = await res.json();
                router.push(`/messages/${data.threadId}`);
            }
        } finally {
            setLoading(null);
        }
    }

    const others = members.filter((m) => m.id !== currentUserId);

    return (
        <Stack gap={12}>
            {others.length === 0 && (
                <Typography style={{ color: "rgba(255,255,255,0.3)", fontStyle: "italic", textAlign: "center", padding: "3rem" }}>
                    inga andra medlemmar än.
                </Typography>
            )}
            {others.map((m) => (
                <Box
                    key={m.id}
                    style={{
                        padding: "1.25rem 1.5rem",
                        borderRadius: "20px",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        transition: "all 0.2s"
                    }}
                    className="hover:bg-white/[0.04] hover:border-white/10"
                >
                    <Stack direction="horizontal" gap={16} align="center">
                        <AvatarPreview avatarId={m.avatarId} name={m.name} size="md" />
                        <Box>
                            <Typography style={{ fontWeight: 700, fontSize: "1.05rem", color: "white" }}>{m.name}</Typography>
                            <Typography style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", textTransform: "lowercase" }}>{m.role}</Typography>
                        </Box>
                    </Stack>
                    <Box
                        onClick={() => !loading && startDm(m.id)}
                        style={{
                            padding: "0.6rem 1.25rem",
                            borderRadius: "12px",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            cursor: loading === m.id ? "default" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            transition: "all 0.2s"
                        }}
                        className="hover:bg-white/10"
                    >
                        <MessageSquare size={16} style={{ opacity: 0.6 }} />
                        <Typography style={{ fontSize: "0.9rem", fontWeight: 700 }}>
                            {loading === m.id ? "..." : "meddelande"}
                        </Typography>
                    </Box>
                </Box>
            ))}
        </Stack>
    );
}
