"use client";

import { useState } from "react";
import Link from "next/link";
import { createChannel, deleteChannel } from "@/lib/actions/channels";

interface Channel {
    id: string;
    name: string;
    description?: string | null;
}

interface Props {
    spaceId: string;
    channels: Channel[];
    canManage: boolean;
}

export default function ChannelList({ spaceId, channels: initial, canManage }: Props) {
    const [channels, setChannels] = useState<Channel[]>(initial);
    const [adding, setAdding] = useState(false);
    const [newName, setNewName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!newName.trim() || loading) return;
        setLoading(true);
        setError("");
        try {
            const channel = await createChannel(spaceId, newName.trim());
            setChannels((prev) => [...prev, channel].sort((a, b) => a.name.localeCompare(b.name)));
            setNewName("");
            setAdding(false);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "failed to create channel");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(channelId: string, name: string) {
        if (!confirm(`Delete #${name}? This will delete all messages.`)) return;
        try {
            await deleteChannel(channelId);
            setChannels((prev) => prev.filter((c) => c.id !== channelId));
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "failed to delete channel");
        }
    }

    return (
        <div>
            <div className="row-between mb-4">
                <h3 className="page-title" style={{ fontSize: "var(--font-size-md)" }}>
                    channels
                </h3>
                {canManage && (
                    <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => { setAdding(!adding); setError(""); }}
                    >
                        {adding ? "✕ cancel" : "+ new"}
                    </button>
                )}
            </div>

            {adding && (
                <form onSubmit={handleCreate} style={{ marginBottom: "var(--space-3)", display: "flex", gap: "var(--space-2)" }}>
                    <input
                        className="input"
                        placeholder="channel-name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        autoFocus
                        style={{ flex: 1 }}
                    />
                    <button type="submit" className="btn btn-primary btn-sm" disabled={loading || !newName.trim()}>
                        {loading ? "..." : "create"}
                    </button>
                </form>
            )}
            {error && <div className="error-text text-xs mb-2">{error}</div>}

            <div className="stack">
                {channels.map((channel) => (
                    <div key={channel.id} style={{ position: "relative" }}>
                        <Link href={`/spaces/${spaceId}/chat/${channel.id}`} style={{ textDecoration: "none", display: "block" }}>
                            <div className="card card-hover card-compact" style={{ paddingRight: canManage ? "var(--space-8)" : undefined }}>
                                <div className="font-semibold">
                                    <span className="text-neon">#</span>{" "}
                                    {channel.name.toLowerCase()}
                                </div>
                                {channel.description && (
                                    <div className="text-xs text-muted mt-2">{channel.description}</div>
                                )}
                            </div>
                        </Link>
                        {canManage && (
                            <button
                                onClick={() => handleDelete(channel.id, channel.name)}
                                style={{
                                    position: "absolute",
                                    right: "var(--space-2)",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    color: "var(--color-danger)",
                                    cursor: "pointer",
                                    fontSize: "var(--font-size-sm)",
                                    padding: "var(--space-1)",
                                    opacity: 0.6,
                                }}
                                title="delete channel"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                ))}
                {channels.length === 0 && (
                    <div className="text-muted text-sm">no channels yet.{canManage && " create one above."}</div>
                )}
            </div>
        </div>
    );
}
