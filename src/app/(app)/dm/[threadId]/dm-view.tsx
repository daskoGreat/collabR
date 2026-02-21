"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import BackButton from "@/components/back-button";

interface Message {
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; name: string };
}

interface Props {
    threadId: string;
    otherUser: { id: string; name: string };
    currentUser: { id: string; name: string };
    initialMessages: Message[];
}

export default function DmView({ threadId, otherUser, currentUser, initialMessages }: Props) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [updating, setUpdating] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
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
                body: JSON.stringify({ threadId, content }),
            });
            if (res.ok) {
                const data = await res.json();
                addMessages([{ id: data.id, content, createdAt: new Date().toISOString(), user: currentUser }]);
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
                <div className="row" style={{ gap: "var(--space-4)" }}>
                    <BackButton />
                    <div className="topbar-title">
                        <span className="text-muted">dm /</span>{" "}
                        <span className="topbar-title-highlight">@</span>
                        {otherUser.name.toLowerCase()}
                    </div>
                </div>
            </div>
            <div className="chat-container">
                <div className="chat-messages">
                    {messages.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-state-icon">✉</div>
                            <div className="empty-state-title">start a conversation</div>
                            <div className="empty-state-text">
                                this is the beginning of your conversation with {otherUser.name}.
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
                                    <div className="chat-message-content">{msg.content}</div>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <div className="chat-input-area">
                    <form className="chat-input-form" onSubmit={handleSend}>
                        <span className="chat-input-prompt">{">"}</span>
                        <input
                            ref={inputRef}
                            type="text"
                            className="input"
                            placeholder={`message ${otherUser.name.toLowerCase()}...`}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            autoFocus
                        />
                        <button type="submit" className="btn btn-primary" disabled={sending || !input.trim()}>
                            send
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
