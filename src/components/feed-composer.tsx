"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createFeedPost } from "@/lib/actions/feed";
import AttachmentPicker from "./attachment-picker";
import AttachmentList from "./attachment-list";
import { Spinner } from "./ui/loading-components";
import MentionList from "./mention-list";

interface User {
    id: string;
    name: string;
}

interface Props {
    user: { id: string; name: string };
}

export default function FeedComposer({ user }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isExpanded, setIsExpanded] = useState(false);
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pendingAttachments, setPendingAttachments] = useState<{ url: string; name: string; mimeType: string; size: number }[]>([]);

    // Mention state
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionUsers, setMentionUsers] = useState<User[]>([]);
    const [mentionIndex, setMentionIndex] = useState(0);
    const [mentionLoading, setMentionLoading] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!content.trim() && pendingAttachments.length === 0) return;

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append("content", content);
        if (pendingAttachments.length > 0) {
            formData.append("attachments", JSON.stringify(pendingAttachments));
        }

        const res = await createFeedPost(formData);

        if (res.success) {
            startTransition(() => {
                router.refresh();
                setIsExpanded(false);
                setContent("");
                setPendingAttachments([]);
                setIsSubmitting(false);
            });
        } else if (res.error) {
            setIsSubmitting(false);
            alert(res.error);
        } else {
            setIsSubmitting(false);
            alert("Kunde inte skapa inlägg"); // Fallback for generic error
        }
    }

    // Mention handlers
    const handleInputChange = (val: string) => {
        setContent(val);
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
        const textBeforeCursor = content.slice(0, cursorPosition);
        const textAfterCursor = content.slice(cursorPosition);
        const lastAtIndex = textBeforeCursor.lastIndexOf("@");

        const newText = textBeforeCursor.slice(0, lastAtIndex) + `@${targetUser.name} ` + textAfterCursor;
        setContent(newText);
        setMentionQuery(null);

        // Refocus and set cursor
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                const newPos = lastAtIndex + targetUser.name.length + 2;
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
                // Global search for feed
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

    if (!isExpanded) {
        return (
            <div className="feed-card mb-[var(--space-10)] p-[var(--space-5)]">
                <div className="flex items-center gap-[var(--space-4)]">
                    <div className="feed-avatar w-10 h-10 border-none bg-primary/10 text-primary">
                        {user.name[0].toUpperCase()}
                    </div>
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="feed-composer-input flex-1 hover:shadow-glow-sm"
                    >
                        dela en ny insikt eller fundering...
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="feed-card mb-[var(--space-10)] transition-all duration-300 ring-1 ring-neon-green/5 shadow-glow-sm relative">
            <form onSubmit={handleSubmit}>
                <div className="p-[var(--space-5)]">
                    <div className="flex items-center gap-[var(--space-3)] mb-[var(--space-5)]">
                        <div className="feed-avatar w-10 h-10 border-none bg-primary/10 text-primary">
                            {user.name[0].toUpperCase()}
                        </div>
                        <div>
                            <div className="text-sm font-bold text-bright">{user.name.toLowerCase()}</div>
                            <div className="text-[10px] text-muted font-mono uppercase tracking-wider">delar en insikt</div>
                        </div>
                    </div>

                    <div className="relative">
                        {mentionQuery !== null && (
                            <MentionList
                                users={mentionUsers}
                                selectedIndex={mentionIndex}
                                onSelect={(u) => insertMention(u)}
                                loading={mentionLoading}
                            />
                        )}
                        <textarea
                            ref={inputRef}
                            autoFocus
                            className="flex-1 feed-textarea resize-none min-h-[160px] w-full"
                            placeholder="vad vill du dela med communityt idag?"
                            value={content}
                            onChange={(e) => handleInputChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                </div>

                <div className="px-[var(--space-5)] pb-[var(--space-5)]">
                    {pendingAttachments.length > 0 && (
                        <div className="mb-[var(--space-4)] bg-black/20 rounded p-[var(--space-3)] border border-white/5">
                            <AttachmentList
                                attachments={pendingAttachments}
                                onRemove={(url) => setPendingAttachments(pendingAttachments.filter(a => a.url !== url))}
                            />
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <AttachmentPicker
                            onUploadSuccess={(url, file) => setPendingAttachments([...pendingAttachments, { url, name: file.name, mimeType: file.type, size: file.size }])}
                            onUploadError={(err) => alert(err)}
                            spaceId="feed"
                        />

                        <div className="flex gap-[var(--space-3)]">
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm text-muted hover:text-bright"
                                onClick={() => {
                                    setIsExpanded(false);
                                    setContent("");
                                    setPendingAttachments([]);
                                }}
                            >
                                avbryt
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary btn-sm px-8 shadow-glow-sm min-w-[120px]"
                                disabled={isSubmitting || isPending || (!content.trim() && pendingAttachments.length === 0)}
                            >
                                {isSubmitting || isPending ? (
                                    <div className="flex items-center gap-2">
                                        <Spinner size="sm" />
                                        <span>postar...</span>
                                    </div>
                                ) : "publicera"}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
