"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import BackButton from "@/components/back-button";
import AttachmentPicker from "@/components/attachment-picker";
import AttachmentList from "@/components/attachment-list";
import MessageContent from "@/components/message-content";
import { updatePresence, renameThread, leaveThread } from "@/lib/actions/chat";
import { useRouter } from "next/navigation";

interface Attachment {
    id: string;
    url: string;
    name: string;
    mimeType: string;
    size: number;
}

interface Message {
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; name: string };
    attachments?: Attachment[];
}

interface Props {
    threadId: string;
    title: string;
    isGroup: boolean;
    otherUser: { id: string; name: string; lastSeenAt?: Date | null } | null;
    currentUser: { id: string; name: string };
    initialMessages: Message[];
}

export default function DmView({ threadId, title, isGroup, otherUser, currentUser, initialMessages }: Props) {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [updating, setUpdating] = useState(false);
    const [pendingAttachments, setPendingAttachments] = useState<{ url: string; name: string; mimeType: string; size: number }[]>([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(title);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const lastMessageIdRef = useRef<string | null>(
        initialMessages.length > 0 ? initialMessages[initialMessages.length - 1].id : null
    );

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const addMessages = useCallback((newMsgs: Message[]) => {
        setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const fresh = newMsgs.filter((m) => !existingIds.has(m.id));
            if (fresh.length === 0) return prev;
            const updated = [...prev, ...fresh].sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            lastMessageIdRef.current = updated[updated.length - 1].id;
            return updated;
        });
    }, []);

    // Pusher real-time subscription
    useEffect(() => {
        let cleanup: (() => void) | undefined;
        try {
            const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
            const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
            if (!key || !cluster) throw new Error("Pusher not configured");
            import("pusher-js").then(({ default: PusherClient }) => {
                const pusher = new PusherClient(key, { cluster });
                const ch = pusher.subscribe(`dm-${threadId}`);
                ch.bind("new-dm", (data: Message) => addMessages([data]));
                cleanup = () => {
                    ch.unbind_all();
                    pusher.unsubscribe(`dm-${threadId}`);
                    pusher.disconnect();
                };
            }).catch(() => { });
        } catch { }
        return () => cleanup?.();
    }, [threadId, addMessages]);

    // Polling fallback every 3 seconds
    useEffect(() => {
        const poll = async () => {
            try {
                const params = new URLSearchParams({ threadId });
                if (lastMessageIdRef.current) params.set("after", lastMessageIdRef.current);
                const res = await fetch(`/api/dm/messages?${params}`);
                if (res.ok) {
                    const data: Message[] = await res.json();
                    if (data.length > 0) addMessages(data);
                }
            } catch { }
        };
        const interval = setInterval(poll, 3000);
        return () => clearInterval(interval);
    }, [threadId, addMessages]);

    // Mark as read
    useEffect(() => {
        const markAsRead = async () => {
            try {
                await fetch("/api/dm/read", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ threadId }),
                });
            } catch (err) {
                // ignore
            }
        };

        markAsRead();
        if (messages.length > 0) {
            markAsRead();
        }
    }, [threadId, messages.length]);

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!input.trim() || sending) return;
        setSending(true);
        const content = input.trim();
        setInput("");
        try {
            const res = await fetch("/api/dm/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    threadId,
                    content,
                    attachments: pendingAttachments
                }),
            });
            if (res.ok) {
                const data = await res.json();
                addMessages([{
                    id: data.id,
                    content,
                    createdAt: new Date().toISOString(),
                    user: currentUser,
                    attachments: pendingAttachments.map((a, i) => ({ ...a, id: `temp-${i}` }))
                }]);
                setPendingAttachments([]);
            }
        } catch {
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    }

    async function handleUpdate(messageId: string) {
        if (!editContent.trim() || updating) return;
        setUpdating(true);
        try {
            const res = await fetch("/api/dm/message", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messageId, content: editContent.trim() }),
            });
            if (res.ok) {
                setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: editContent.trim() } : m));
                setEditingId(null);
            }
        } catch (err) {
            console.error("Update failed:", err);
        } finally {
            setUpdating(false);
        }
    }

    async function handleDelete(messageId: string) {
        if (!confirm("Are you sure you want to delete this message?")) return;
        try {
            const res = await fetch(`/api/dm/message?id=${messageId}`, { method: "DELETE" });
            if (res.ok) {
                setMessages(prev => prev.filter(m => m.id !== messageId));
            }
        } catch (err) {
            console.error("Delete failed:", err);
        }
    }

    function formatTime(dateStr: string) {
        return new Date(dateStr).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
    }

    return (
        <>
            <div className="topbar">
                <div className="row-between w-full">
                    <div className="row" style={{ gap: "var(--space-4)" }}>
                        <BackButton />
                        <div className="topbar-title flex flex-col items-start !gap-0">
                            <div className="flex items-center gap-2">
                                <span className="topbar-title-highlight">{isGroup ? "⚑" : "@"}</span>
                                <span>{title.toLowerCase()}</span>
                            </div>
                            {!isGroup && otherUser && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className={`w-2 h-2 rounded-full ${otherUser.lastSeenAt && (new Date().getTime() - new Date(otherUser.lastSeenAt).getTime() < 5 * 60 * 1000)
                                            ? "bg-success shadow-[0_0_8px_var(--success)]"
                                            : "bg-muted"
                                        }`} />
                                    <span className="text-[10px] text-muted uppercase font-bold tracking-wider">
                                        {otherUser.lastSeenAt && (new Date().getTime() - new Date(otherUser.lastSeenAt).getTime() < 5 * 60 * 1000)
                                            ? "online" : "offline"}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="relative" ref={menuRef}>
                        <button className="btn btn-ghost" onClick={() => setIsMenuOpen(!isMenuOpen)}>⋮</button>
                        {isMenuOpen && (
                            <div className="card card-compact absolute top-full right-0 mt-2 min-w-[200px] z-[100] shadow-lg">
                                <div className="p-1">
                                    {isGroup && (
                                        <button className="sidebar-link w-full text-left" onClick={() => { setIsMenuOpen(false); setIsRenaming(true); }}>
                                            <span className="sidebar-link-icon">✎</span>
                                            byt namn
                                        </button>
                                    )}
                                    <button className="sidebar-link w-full text-left text-danger" onClick={async () => {
                                        if (confirm("Lämna chatten?")) {
                                            await leaveThread(threadId);
                                            router.push("/dm");
                                            router.refresh();
                                        }
                                    }}>
                                        <span className="sidebar-link-icon">⏻</span>
                                        lämna chatt
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isRenaming && (
                <div className="modal-overlay">
                    <div className="card max-w-md w-full p-6">
                        <div className="modal-title">byt namn på grupp</div>
                        <input
                            type="text"
                            className="input w-full mb-6"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="gruppnamn..."
                            autoFocus
                        />
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setIsRenaming(false)}>avbryt</button>
                            <button className="btn btn-primary" onClick={async () => {
                                await renameThread(threadId, newName);
                                setIsRenaming(false);
                            }}>spara</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="chat-container">
                <div className="chat-messages">
                    {messages.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-state-icon">✉</div>
                            <div className="empty-state-title">{isGroup ? "denna grupp" : "denna konversation"}</div>
                            <div className="empty-state-text">
                                {isGroup ? "detta är början på gruppchatten." : `början på din konversation med ${otherUser?.name}.`}
                            </div>
                        </div>
                    )}
                    {messages.map((msg) => (
                        <div key={msg.id} className={`chat-message ${msg.user.id === currentUser.id ? "chat-message-own" : ""}`}>
                            <div className="chat-message-avatar">
                                {msg.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="chat-message-body">
                                <div className="chat-message-header">
                                    <span className="chat-message-name">{msg.user.name}</span>
                                    <span className="chat-message-time">{formatTime(msg.createdAt)}</span>
                                    {msg.user.id === currentUser.id && !editingId && (
                                        <div className="chat-message-actions">
                                            <button
                                                className="btn-link text-xs"
                                                onClick={() => {
                                                    setEditingId(msg.id);
                                                    setEditContent(msg.content);
                                                }}
                                            >
                                                redigera
                                            </button>
                                            <button
                                                className="btn-link text-xs text-danger"
                                                onClick={() => handleDelete(msg.id)}
                                            >
                                                ta bort
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {editingId === msg.id ? (
                                    <div className="chat-edit-area mt-1">
                                        <textarea
                                            className="input text-sm"
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            autoFocus
                                            rows={2}
                                        />
                                        <div className="row mt-2" style={{ gap: "var(--space-2)" }}>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() => handleUpdate(msg.id)}
                                                disabled={updating || !editContent.trim()}
                                            >
                                                spara
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => setEditingId(null)}
                                                disabled={updating}
                                            >
                                                avbryt
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <MessageContent content={msg.content} />
                                        {msg.attachments && msg.attachments.length > 0 && (
                                            <AttachmentList attachments={msg.attachments} readOnly />
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <div className="chat-input-area">
                    {pendingAttachments.length > 0 && (
                        <div className="px-4 py-2 border-b border-subtle bg-secondary-alt">
                            <AttachmentList
                                attachments={pendingAttachments}
                                onRemove={(url) => setPendingAttachments(prev => prev.filter(a => a.url !== url))}
                            />
                        </div>
                    )}
                    <form className="chat-input-form" onSubmit={handleSend}>
                        <AttachmentPicker
                            spaceId="dm" // DM space identifier or similar
                            onUploadSuccess={(url, file) => {
                                setPendingAttachments(prev => [...prev, {
                                    url,
                                    name: file.name,
                                    mimeType: file.type,
                                    size: file.size
                                }]);
                            }}
                            onUploadError={(err) => alert(err)}
                        />
                        <span className="chat-input-prompt">{">"}</span>
                        <input
                            ref={inputRef}
                            type="text"
                            className="input"
                            placeholder={`meddelande till ${title.toLowerCase()}...`}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            autoFocus
                        />
                        <button type="submit" className="btn btn-primary" disabled={sending || (!input.trim() && pendingAttachments.length === 0)}>
                            send
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
