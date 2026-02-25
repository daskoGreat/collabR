"use client";

import { useState } from "react";
import Link from "next/link";
import { createChannel, deleteChannel } from "@/lib/actions/channels";

interface Channel {
    id: string;
    name: string;
    description?: string | null;
    isClosed?: boolean;
}

interface User {
    id: string;
    name: string;
}

interface Props {
    spaceId: string;
    channels: Channel[];
    canManage: boolean;
    members: User[];
}

import { Lock, Hash, X, Search, Check } from "lucide-react";

export default function ChannelList({ spaceId, channels: initial, canManage, members }: Props) {
    const [channels, setChannels] = useState<Channel[]>(initial);
    const [adding, setAdding] = useState(false);
    const [newName, setNewName] = useState("");
    const [isClosed, setIsClosed] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [memberSearch, setMemberSearch] = useState("");

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(memberSearch.toLowerCase()) &&
        !selectedUsers.includes(m.id)
    );

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!newName.trim() || loading) return;
        setLoading(true);
        setError("");
        try {
            const channel = await createChannel(spaceId, newName.trim(), isClosed, selectedUsers);
            setChannels((prev) => [...prev, channel].sort((a, b) => a.name.localeCompare(b.name)));
            setNewName("");
            setIsClosed(false);
            setSelectedUsers([]);
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
            <div className="row-between mb-4 px-2 pt-2">
                <h3 className="section-title !mb-0" style={{ fontSize: "var(--font-size-xs)" }}>
                    kanaler
                </h3>
                {canManage && (
                    <button
                        className="btn-sidebar-action"
                        onClick={() => { setAdding(!adding); setError(""); }}
                        title={adding ? "avbryt" : "skapa ny kanal"}
                    >
                        {adding ? <X size={14} /> : <Plus size={14} />}
                    </button>
                )}
            </div>

            {adding && (
                <div className="p-3 bg-black/20 rounded-lg mb-6 border border-subtle/30 animate-in fade-in slide-in-from-top-2 duration-300">
                    <form onSubmit={handleCreate} className="stack gap-4">
                        <div className="stack gap-1.5">
                            <label className="text-[10px] uppercase tracking-widest text-muted opacity-60 font-bold">kanalnamn</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/30 font-mono text-sm">#</span>
                                <input
                                    className="input w-full pl-8 !bg-black/40 !border-subtle/20"
                                    placeholder="namn-på-kanal"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-2 bg-white/[0.02] rounded border border-subtle/10 group cursor-pointer" onClick={() => setIsClosed(!isClosed)}>
                            <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isClosed ? "bg-accent-warning/10 text-accent-warning" : "bg-muted/10 text-muted"}`}>
                                    <Lock size={14} strokeWidth={isClosed ? 2.5 : 1.5} />
                                </div>
                                <div className="stack gap-0.5">
                                    <div className="text-[11px] font-bold text-bright tracking-tight">slutet rum</div>
                                    <div className="text-[9px] text-muted opacity-60 italic">endast inbjudna deltagare</div>
                                </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isClosed ? "bg-accent-warning border-accent-warning" : "border-subtle/30"}`}>
                                {isClosed && <Check size={12} className="text-black" strokeWidth={3} />}
                            </div>
                        </div>

                        {isClosed && (
                            <div className="stack gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="stack gap-1.5">
                                    <label className="text-[10px] uppercase tracking-widest text-muted opacity-60 font-bold">bjud in deltagare</label>
                                    <div className="relative">
                                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/30" />
                                        <input
                                            className="input w-full pl-9 !py-1.5 !text-xs !bg-black/40 !border-subtle/20"
                                            placeholder="sök medlemsnamn..."
                                            value={memberSearch}
                                            onChange={(e) => setMemberSearch(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {selectedUsers.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedUsers.map(uid => {
                                            const u = members.find(m => m.id === uid);
                                            return (
                                                <div key={uid} className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.05] border border-subtle/20 rounded text-[10px] text-secondary">
                                                    {u?.name.toLowerCase()}
                                                    <button type="button" onClick={() => setSelectedUsers(prev => prev.filter(id => id !== uid))} className="hover:text-bright">
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {memberSearch.length > 0 && filteredMembers.length > 0 && (
                                    <div className="max-h-32 overflow-y-auto border border-subtle/20 rounded bg-black/40 scrollbar-thin">
                                        {filteredMembers.map(m => (
                                            <button
                                                key={m.id}
                                                type="button"
                                                className="w-full text-left p-2 hover:bg-white/[0.05] text-[11px] transition-colors border-b border-white/[0.02] last:border-none"
                                                onClick={() => {
                                                    setSelectedUsers([...selectedUsers, m.id]);
                                                    setMemberSearch("");
                                                }}
                                            >
                                                {m.name.toLowerCase()}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="row gap-2 mt-2">
                            <button type="submit" className="btn btn-primary btn-sm flex-1 font-bold tracking-widest" disabled={loading || !newName.trim()}>
                                {loading ? "skapar..." : "skapa kanal"}
                            </button>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAdding(false)}>
                                avbryt
                            </button>
                        </div>
                    </form>
                </div>
            )}
            {error && <div className="error-text text-[10px] mb-4 bg-accent-danger/10 p-2 rounded border border-accent-danger/20">{error}</div>}

            <div className="stack gap-1 px-1">
                {channels.map((channel) => (
                    <div key={channel.id} className="relative group/item">
                        <Link href={`/spaces/${spaceId}/chat/${channel.id}`} className="block">
                            <div className={`p-2.5 rounded-lg flex items-center justify-between transition-all hover:bg-white/[0.03] active:scale-[0.98] ${isActive(`/spaces/${spaceId}/chat/${channel.id}`) ? "bg-white/[0.05] shadow-inner" : ""}`}>
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${channel.isClosed ? "bg-accent-warning shadow-[0_0_4px_var(--accent-warning)]" : "bg-primary/40"}`} />
                                    <div className="stack gap-0.5">
                                        <div className="text-[13px] font-medium text-bright tracking-tight flex items-center gap-1.5">
                                            {channel.name.toLowerCase()}
                                            {channel.isClosed && <Lock size={10} className="text-accent-warning opacity-50" />}
                                        </div>
                                    </div>
                                </div>
                                {canManage && (
                                    <button
                                        onClick={(e) => { e.preventDefault(); handleDelete(channel.id, channel.name); }}
                                        className="btn-sidebar-action opacity-0 group-hover/item:opacity-40 hover:!opacity-100 p-1.5 transition-all"
                                        title="ta bort kanal"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        </Link>
                    </div>
                ))}
                {channels.length === 0 && (
                    <div className="p-4 text-center">
                        <div className="text-[10px] text-muted opacity-40 italic">inga aktiva kanaler</div>
                    </div>
                )}
            </div>
        </div>
    );
}

function isActive(path: string) {
    if (typeof window === "undefined") return false;
    return window.location.pathname === path;
}

import { Plus } from "lucide-react";
