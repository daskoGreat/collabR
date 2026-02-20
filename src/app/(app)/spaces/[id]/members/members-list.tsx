"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Member {
    id: string;
    name: string;
    role: string;
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
            const res = await fetch("/api/dm/thread", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetUserId }),
            });
            if (res.ok) {
                const data = await res.json();
                router.push(`/dm/${data.threadId}`);
            }
        } finally {
            setLoading(null);
        }
    }

    const others = members.filter((m) => m.id !== currentUserId);

    return (
        <div className="stack">
            {others.length === 0 && (
                <p className="text-muted text-sm">no other members yet.</p>
            )}
            {others.map((m) => (
                <div key={m.id} className="card" style={{ padding: "var(--space-3)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        <div className="chat-message-avatar" style={{ width: 32, height: 32, fontSize: "var(--font-size-sm)" }}>
                            {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style={{ fontWeight: 500 }}>{m.name}</div>
                            <div className="text-xs text-muted">{m.role.toLowerCase()}</div>
                        </div>
                    </div>
                    <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => startDm(m.id)}
                        disabled={loading === m.id}
                    >
                        {loading === m.id ? "..." : "✉ message"}
                    </button>
                </div>
            ))}
        </div>
    );
}
