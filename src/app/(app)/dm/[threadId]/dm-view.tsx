"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import BackButton from "@/components/back-button";
import AttachmentPicker from "@/components/attachment-picker";
import AttachmentList from "@/components/attachment-list";
import MessageContent from "@/components/message-content";
import { updatePresence, renameThread, leaveThread } from "@/lib/actions/chat";
import { useRouter } from "next/navigation";
import MentionList from "@/components/mention-list";
import Link from "next/link";
import { User, Users } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

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

    // Mention state
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionUsers, setMentionUsers] = useState<User[]>([]);
    const [mentionIndex, setMentionIndex] = useState(0);
    const [mentionLoading, setMentionLoading] = useState(false);
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

    // Mention handlers
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

    const insertMention = (targetUser: User) => {
        if (!inputRef.current) return;
        const cursorPosition = inputRef.current.selectionStart || 0;
        const textBeforeCursor = input.slice(0, cursorPosition);
        const textAfterCursor = input.slice(cursorPosition);
        const lastAtIndex = textBeforeCursor.lastIndexOf("@");

        const newText = textBeforeCursor.slice(0, lastAtIndex) + `@${targetUser.name} ` + textAfterCursor;
        setInput(newText);
        setMentionQuery(null);

        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                const newPos = lastAtIndex + targetUser.name.length + 2;
                inputRef.current.selectionStart = newPos;
                inputRef.current.selectionEnd = newPos;
            }
        }, 0);
    };

    useEffect(() => {
        if (mentionQuery === null) return;
        const timer = setTimeout(async () => {
            setMentionLoading(true);
            try {
                // DM mentions are global for now as well
                const res = await fetch(`/api/users/search?q=${mentionQuery}`);
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
    }, [mentionQuery]);

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
                        <div className="topbar-title">
                            <div className="flex items-center gap-2">
                                <Link href="/spaces" className="text-muted hover:text-primary transition-colors">navet</Link>
                                <span className="text-muted mx-1">/</span>
                                <span className="topbar-title-highlight flex items-center gap-1.5 backdrop-blur-sm bg-primary/20 px-2 py-0.5 rounded border border-subtle/50">
                                    {isGroup ? <Users size={12} strokeWidth={2} /> : <User size={12} strokeWidth={2} />}
                                    {title.toLowerCase()}
                                </span>
                            </div>
                            {!isGroup && otherUser && (
                                <div className="flex items-center gap-1.5 mt-0.5 ml-1">
                                    <div className={`w-1.5 h-1.5 rounded-full ${otherUser.lastSeenAt && (new Date().getTime() - new Date(otherUser.lastSeenAt).getTime() < 5 * 60 * 1000)
                                        ? "bg-success shadow-[0_0_8px_var(--success)]"
                                        : "bg-muted"
                                        }`} />
                                    <span className="text-[9px] text-muted uppercase font-bold tracking-widest opacity-50">
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
                        <div className="empty-state py-20 card border-dashed border-subtle">
                            <div className="empty-state-icon text-muted/30">✉</div>
                            <div className="empty-state-title">{isGroup ? "denna grupp" : "denna konversation"}</div>
                            <div className="empty-state-text">
                                {isGroup ? "detta är början på gruppchatten." : `början på din konversation med ${otherUser?.name.toLowerCase()}.`}
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
                                        {msg.user.name.charAt(0).toUpperCase()}
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
                                spaceId="dm"
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
                            <span className="chat-input-prompt absolute left-4 text-neon-green/20 select-none font-mono text-[10px] tracking-tighter uppercase">dm {">"}</span>
                            <input
                                ref={inputRef}
                                type="text"
                                className="input w-full !pl-14 !bg-transparent !border-none !ring-0 !shadow-none py-2 text-sm"
                                placeholder={`tala till ${title.toLowerCase()}...`}
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
