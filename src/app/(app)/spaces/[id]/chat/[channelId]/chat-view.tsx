"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import BackButton from "@/components/back-button";
import AttachmentPicker from "@/components/attachment-picker";
import AttachmentList from "@/components/attachment-list";
import MessageContent from "@/components/message-content";
import MentionList from "@/components/mention-list";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import Link from "next/link";

interface User {
    id: string;
    name: string;
}

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

import { MessageSquare, Building2 } from "lucide-react";

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

    // Mention state
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionUsers, setMentionUsers] = useState<User[]>([]);
    const [mentionIndex, setMentionIndex] = useState(0);
    const [mentionLoading, setMentionLoading] = useState(false);
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

    // Mention helpers
    const handleInputChange = (val: string) => {
        setInput(val);
        const cursorPosition = inputRef.current?.selectionStart || 0;
        const textBeforeCursor = val.slice(0, cursorPosition);
        const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

        if (mentionMatch) {
            setMentionQuery(mentionMatch[1]);
            setMentionIndex(0);
        } else {
            setMentionQuery(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (mentionQuery !== null && mentionUsers.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setMentionIndex((prev) => (prev + 1) % mentionUsers.length);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setMentionIndex((prev) => (prev - 1 + mentionUsers.length) % mentionUsers.length);
            } else if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                insertMention(mentionUsers[mentionIndex]);
            } else if (e.key === "Escape") {
                setMentionQuery(null);
            }
        }
    };

    const insertMention = (user: User) => {
        if (!inputRef.current) return;
        const cursorPosition = inputRef.current.selectionStart || 0;
        const textBeforeCursor = input.slice(0, cursorPosition);
        const textAfterCursor = input.slice(cursorPosition);
        const lastAtIndex = textBeforeCursor.lastIndexOf("@");

        const newText = textBeforeCursor.slice(0, lastAtIndex) + `@${user.name} ` + textAfterCursor;
        setInput(newText);
        setMentionQuery(null);

        // Refocus and set cursor
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                const newPos = lastAtIndex + user.name.length + 2;
                inputRef.current.selectionStart = newPos;
                inputRef.current.selectionEnd = newPos;
            }
        }, 0);
    };

    // Fetch mentions
    useEffect(() => {
        if (mentionQuery === null) return;

        const timer = setTimeout(async () => {
            setMentionLoading(true);
            try {
                const res = await fetch(`/api/users/search?q=${mentionQuery}&spaceId=${spaceId}`);
                if (res.ok) {
                    const data = await res.json();
                    setMentionUsers(data);
                }
            } catch (err) {
                console.error("Mention search failed:", err);
            } finally {
                setMentionLoading(false);
            }
        }, 200);

        return () => clearTimeout(timer);
    }, [mentionQuery, spaceId]);

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
                        <Link href="/spaces" className="text-muted hover:text-primary transition-colors">navet</Link>
                        <span className="text-muted mx-2">/</span>
                        <Link href={`/spaces/${spaceId}`} className="text-muted hover:text-primary transition-colors flex items-center gap-1.5 inline-flex">
                            <Building2 size={13} strokeWidth={2} />
                            {channel.spaceName.toLowerCase()}
                        </Link>
                        <span className="text-muted mx-2">/</span>
                        <span className="topbar-title-highlight flex items-center gap-1.5 backdrop-blur-sm bg-primary/20 px-2 py-0.5 rounded border border-subtle/50">
                            <MessageSquare size={12} strokeWidth={2} />
                            {channel.name.toLowerCase()}
                        </span>
                    </div>
                </div>
            </div>
            <div className="chat-container">
                <div className="chat-messages scrollbar-thin">
                    {messages.length === 0 && (
                        <div className="empty-state py-20 card border-dashed border-subtle">
                            <div className="empty-state-icon text-muted/30">░</div>
                            <div className="empty-state-title">tyst i kanalen</div>
                            <div className="empty-state-text">
                                bli den första att bryta tystnaden. alla insikter börjar med ett hej.
                            </div>
                        </div>
                    )}
                    {messages.map((msg, index) => {
                        const prevMsg = index > 0 ? messages[index - 1] : null;
                        const isSameUser = prevMsg?.user.id === msg.user.id;
                        const timeDiff = prevMsg
                            ? new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()
                            : Infinity;
                        const isGrouped = isSameUser && timeDiff < 1000 * 60 * 5; // 5 minutes

                        const isMentioned = msg.content.toLowerCase().includes(`@${currentUser.name.toLowerCase()}`);

                        return (
                            <div
                                key={msg.id}
                                className={`chat-message group ${msg.user.id === currentUser.id ? "chat-message-own" : ""} ${isMentioned ? "chat-message-mentioned" : ""} ${isGrouped ? "chat-message-grouped" : ""}`}
                            >
                                {!isGrouped ? (
                                    <div className="chat-message-avatar font-bold">
                                        {getInitial(msg.user.name)}
                                    </div>
                                ) : (
                                    <div className="chat-message-spacer w-7 shrink-0 flex justify-center items-center">
                                        <div className="w-[1px] h-full bg-subtle/20 group-hover:bg-subtle/50 transition-colors" />
                                    </div>
                                )}
                                <div className="chat-message-body">
                                    {!isGrouped && (
                                        <div className="chat-message-header">
                                            <span className="chat-message-name font-bold text-bright">{msg.user.name.toLowerCase()}</span>
                                            <span className="chat-message-time opacity-50 font-mono">
                                                {formatTime(msg.createdAt)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="chat-content-container relative">
                                        {isGrouped && (
                                            <span className="absolute -left-10 top-0.5 opacity-0 group-hover:opacity-30 transition-opacity text-[9px] font-mono whitespace-nowrap">
                                                {formatTime(msg.createdAt)}
                                            </span>
                                        )}
                                        {editingId === msg.id ? (
                                            <div className="chat-edit-area mt-2">
                                                <textarea
                                                    className="input text-sm min-h-[80px]"
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    autoFocus
                                                    rows={2}
                                                />
                                                <div className="row mt-3" style={{ gap: "var(--space-3)" }}>
                                                    <button
                                                        className="btn btn-primary btn-sm px-4 flex items-center gap-2"
                                                        onClick={() => handleUpdate(msg.id)}
                                                        disabled={updating || !editContent.trim()}
                                                    >
                                                        {updating && <LoadingSpinner size="sm" className="text-current" />}
                                                        <span>{updating ? "sparar..." : "spara ändringar"}</span>
                                                    </button>
                                                    <button
                                                        className="btn btn-secondary btn-sm px-4"
                                                        onClick={() => setEditingId(null)}
                                                        disabled={updating}
                                                    >
                                                        avbryt
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="chat-content-vibe">
                                                <MessageContent content={msg.content} currentUserName={currentUser.name} />
                                                {msg.attachments && msg.attachments.length > 0 && (
                                                    <div className="mt-3">
                                                        <AttachmentList attachments={msg.attachments} readOnly />
                                                    </div>
                                                )}
                                                {msg.user.id === currentUser.id && !editingId && (
                                                    <div className="chat-message-actions absolute -right-2 top-0 translate-x-full pl-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                                        <button
                                                            className="btn-link text-[10px] uppercase tracking-wider opacity-50 hover:opacity-100"
                                                            onClick={() => {
                                                                setEditingId(msg.id);
                                                                setEditContent(msg.content);
                                                            }}
                                                        >
                                                            edit
                                                        </button>
                                                        <button
                                                            className="btn-link text-[10px] uppercase tracking-wider text-danger opacity-50 hover:opacity-100"
                                                            onClick={() => handleDelete(msg.id)}
                                                        >
                                                            del
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
                <div className="chat-input-area border-t border-subtle bg-secondary/80 backdrop-blur-md">
                    {mentionQuery !== null && (
                        <MentionList
                            users={mentionUsers}
                            selectedIndex={mentionIndex}
                            onSelect={(u) => insertMention(u)}
                            loading={mentionLoading}
                        />
                    )}
                    {pendingAttachments.length > 0 && (
                        <div className="px-4 py-3 border-b border-subtle bg-black/20 rounded-t-lg mx-4">
                            <AttachmentList
                                attachments={pendingAttachments}
                                onRemove={(url) => setPendingAttachments(prev => prev.filter(a => a.url !== url))}
                            />
                        </div>
                    )}
                    <form className="chat-input-form items-center p-2" onSubmit={handleSend}>
                        <div className="flex items-center gap-1">
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
                        </div>
                        <div className="chat-input-wrapper flex-1 relative flex items-center bg-black/40 rounded-full border border-subtle/30 focus-within:border-neon-green/30 transition-colors">
                            <span className="chat-input-prompt absolute left-4 text-neon-green/20 select-none font-mono text-[10px] tracking-tighter uppercase">msg {">"}</span>
                            <input
                                ref={inputRef}
                                type="text"
                                className="input w-full !bg-transparent !border-none !ring-0 !shadow-none py-2 text-sm"
                                style={{ paddingLeft: '3.5rem' }}
                                placeholder={`skicka till #${channel.name.toLowerCase()}...`}
                                value={input}
                                onChange={(e) => handleInputChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                disabled={sending}
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary !rounded-full w-10 h-10 !p-0 shadow-glow-sm flex items-center justify-center shrink-0"
                            disabled={sending || (!input.trim() && pendingAttachments.length === 0)}
                        >
                            {sending ? <LoadingSpinner size="sm" className="text-current" /> : <span className="text-lg">↵</span>}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
