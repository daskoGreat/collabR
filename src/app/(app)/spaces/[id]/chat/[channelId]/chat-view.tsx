"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import BackButton from "@/components/back-button";
import AttachmentPicker from "@/components/attachment-picker";
import AttachmentList from "@/components/attachment-list";
import MessageContent from "@/components/message-content";

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
    channel: { id: string; name: string; spaceName: string };
    initialMessages: Message[];
    currentUser: { id: string; name: string };
    spaceId: string;
}

export default function ChatView({
    channel,
    initialMessages,
    currentUser,
    spaceId,
}: Props) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [updating, setUpdating] = useState(false);
    const [pendingAttachments, setPendingAttachments] = useState<{ url: string; name: string; mimeType: string; size: number }[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const lastMessageIdRef = useRef<string | null>(
        initialMessages.length > 0 ? initialMessages[initialMessages.length - 1].id : null
    );
    const pusherConnectedRef = useRef(false);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Add new messages without duplicates
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

    // Subscribe to Pusher for realtime messages
    useEffect(() => {
        let cleanup: (() => void) | undefined;
        try {
            const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
            const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
            if (!key || !cluster) throw new Error("Pusher not configured");

            import("pusher-js").then(({ default: PusherClient }) => {
                const pusher = new PusherClient(key, { cluster });
                const ch = pusher.subscribe(`channel-${channel.id}`);
                ch.bind("new-message", (data: Message) => {
                    addMessages([data]);
                });
                ch.bind("pusher:subscription_succeeded", () => {
                    pusherConnectedRef.current = true;
                });
                cleanup = () => {
                    ch.unbind_all();
                    pusher.unsubscribe(`channel-${channel.id}`);
                    pusher.disconnect();
                };
            }).catch(() => {
                pusherConnectedRef.current = false;
            });
        } catch {
            pusherConnectedRef.current = false;
        }
        return () => cleanup?.();
    }, [channel.id, addMessages]);

    // Polling fallback — fetch new messages every 3s
    useEffect(() => {
        const poll = async () => {
            try {
                const params = new URLSearchParams({ channelId: channel.id });
                if (lastMessageIdRef.current) params.set("after", lastMessageIdRef.current);
                const res = await fetch(`/api/chat/messages?${params}`);
                if (res.ok) {
                    const data: Message[] = await res.json();
                    if (data.length > 0) addMessages(data);
                }
            } catch {
                // ignore
            }
        };

        const interval = setInterval(poll, 3000);
        return () => clearInterval(interval);
    }, [channel.id, addMessages]);

    // Mark as read
    useEffect(() => {
        const markAsRead = async () => {
            try {
                await fetch("/api/chat/read", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ channelId: channel.id }),
                });
            } catch (err) {
                // ignore
            }
        };

        markAsRead();
        // Also mark as read when new messages are added and the tab is focused
        if (messages.length > 0) {
            markAsRead();
        }
    }, [channel.id, messages.length]);

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!input.trim() || sending) return;

        setSending(true);
        const content = input.trim();
        setInput("");

        try {
            const res = await fetch("/api/chat/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    channelId: channel.id,
                    spaceId,
                    content,
                    attachments: pendingAttachments
                }),
            });

            if (res.ok) {
                const data = await res.json();
                // Optimistically add own message
                addMessages([{
                    id: data.id,
                    content,
                    createdAt: new Date().toISOString(),
                    user: currentUser,
                    attachments: pendingAttachments.map((a, i) => ({ ...a, id: `temp-${i}` }))
                }]);
                setPendingAttachments([]);
            } else {
                const err = await res.json();
                console.error("send failed:", err);
            }
        } catch (err) {
            console.error("send error:", err);
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    }

    async function handleUpdate(messageId: string) {
        if (!editContent.trim() || updating) return;
        setUpdating(true);
        try {
            const res = await fetch("/api/chat/message", {
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
            const res = await fetch(`/api/chat/message?id=${messageId}`, { method: "DELETE" });
            if (res.ok) {
                setMessages(prev => prev.filter(m => m.id !== messageId));
            }
        } catch (err) {
            console.error("Delete failed:", err);
        }
    }

    function formatTime(dateStr: string) {
        const d = new Date(dateStr);
        return d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
    }

    function getInitial(name: string) {
        return name.charAt(0).toUpperCase();
    }

    return (
        <>
            <div className="topbar">
                <div className="row" style={{ gap: "var(--space-4)" }}>
                    <BackButton />
                    <div className="topbar-title">
                        <span className="text-muted">{channel.spaceName.toLowerCase()} /</span>{" "}
                        <span className="topbar-title-highlight">#</span>
                        {channel.name.toLowerCase()}
                    </div>
                </div>
            </div>
            <div className="chat-container">
                <div className="chat-messages">
                    {messages.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-state-icon">💬</div>
                            <div className="empty-state-title">no messages yet</div>
                            <div className="empty-state-text">
                                be the first to say something. no judgment here.
                            </div>
                        </div>
                    )}
                    {messages.map((msg) => (
                        <div key={msg.id} className={`chat-message ${msg.user.id === currentUser.id ? "chat-message-own" : ""}`}>
                            <div className="chat-message-avatar">
                                {getInitial(msg.user.name)}
                            </div>
                            <div className="chat-message-body">
                                <div className="chat-message-header">
                                    <span className="chat-message-name">{msg.user.name}</span>
                                    <span className="chat-message-time">
                                        {formatTime(msg.createdAt)}
                                    </span>
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
                            spaceId={spaceId}
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
                            placeholder={`message #${channel.name.toLowerCase()}...`}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={sending || (!input.trim() && pendingAttachments.length === 0)}
                        >
                            send
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
