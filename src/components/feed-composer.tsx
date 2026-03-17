"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createFeedPost } from "@/lib/actions/feed";
import AttachmentPicker from "./attachment-picker";
import AttachmentList from "./attachment-list";
import { Spinner } from "./ui/loading-components";
import MentionList from "./mention-list";
import { AvatarPreview } from "./avatar-builder/AvatarPreview";
import { Box } from "./layout/Box";
import { Stack } from "./layout/Stack";
import { Typography } from "./ui/typography";

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
            <Box
                style={{
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: "32px",
                    border: "1px solid rgba(255,255,255,0.05)",
                    padding: "1.5rem 2rem",
                    cursor: "pointer",
                    transition: "all 0.2s"
                }}
                className="hover:bg-white/[0.04] hover:border-white/10"
                onClick={() => setIsExpanded(true)}
            >
                <Stack direction="horizontal" gap={16} align="center">
                    <AvatarPreview
                        avatarId={(user as any).avatarId}
                        name={user.name}
                        size="sm"
                    />
                    <Typography style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.95rem" }}>
                        Dela en ny insikt eller fundering...
                    </Typography>
                </Stack>
            </Box>
        );
    }

    return (
        <Box
            style={{
                background: "rgba(255,255,255,0.02)",
                borderRadius: "32px",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "2.5rem",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
            }}
        >
            <form onSubmit={handleSubmit}>
                <Stack gap={32}>
                    <Stack direction="horizontal" gap={16} align="center">
                        <AvatarPreview
                            avatarId={(user as any).avatarId}
                            name={user.name}
                            size="md"
                        />
                        <Box>
                            <Typography style={{ fontWeight: 700, fontSize: "1.1rem", color: "white" }}>{user.name.toLowerCase()}</Typography>
                            <Typography style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Delar en insikt</Typography>
                        </Box>
                    </Stack>

                    <Box style={{ position: "relative" }}>
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
                            className="feed-textarea"
                            style={{
                                width: "100%",
                                minHeight: "160px",
                                background: "none",
                                border: "none",
                                outline: "none",
                                color: "white",
                                fontSize: "1.1rem",
                                lineHeight: "1.6",
                                padding: 0,
                                resize: "none"
                            }}
                            placeholder="Vad vill du dela med communityt idag?"
                            value={content}
                            onChange={(e) => handleInputChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </Box>

                    {pendingAttachments.length > 0 && (
                        <Box style={{ background: "rgba(0,0,0,0.2)", borderRadius: "16px", padding: "1rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <AttachmentList
                                attachments={pendingAttachments}
                                onRemove={(url) => setPendingAttachments(pendingAttachments.filter(a => a.url !== url))}
                            />
                        </Box>
                    )}

                    <Stack direction="horizontal" justify="between" align="center" style={{ paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <AttachmentPicker
                            onUploadSuccess={(url, file) => setPendingAttachments([...pendingAttachments, { url, name: file.name, mimeType: file.type, size: file.size }])}
                            onUploadError={(err) => alert(err)}
                            spaceId="feed"
                        />

                        <Stack direction="horizontal" gap={12}>
                            <button
                                type="button"
                                className="btn btn-ghost"
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
                                className="btn btn-primary"
                                style={{ minWidth: "120px" }}
                                disabled={isSubmitting || isPending || (!content.trim() && pendingAttachments.length === 0)}
                            >
                                {isSubmitting || isPending ? (
                                    <Stack direction="horizontal" gap={8} align="center">
                                        <Spinner size="sm" />
                                        <span>postar...</span>
                                    </Stack>
                                ) : "publicera"}
                            </button>
                        </Stack>
                    </Stack>
                </Stack>
            </form>
        </Box>
    );
}
