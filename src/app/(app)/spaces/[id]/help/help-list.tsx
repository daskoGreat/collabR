"use client";

import { useState, useRef, useEffect } from "react";
import { createPost } from "@/lib/actions/posts";
import Link from "next/link";
import AttachmentPicker from "@/components/attachment-picker";
import AttachmentList from "@/components/attachment-list";
import MentionList from "@/components/mention-list";
import MessageContent from "@/components/message-content";

interface User {
    id: string;
    name: string;
}

interface Attachment {
    url: string;
    name: string;
    mimeType: string;
    size: number;
}

interface Post {
    id: string;
    title: string;
    content: string;
    tags: string[];
    solved: boolean;
    user: { id: string; name: string };
    answerCount: number;
    createdAt: string;
}

interface Props {
    spaceId: string;
    posts: Post[];
    currentUserId: string;
    currentUserName?: string;
}

export default function HelpList({ spaceId, posts, currentUserName }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [filter, setFilter] = useState<"all" | "open" | "solved">("all");
    const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
    const [content, setContent] = useState("");

    // Mention state
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionUsers, setMentionUsers] = useState<User[]>([]);
    const [mentionIndex, setMentionIndex] = useState(0);
    const [mentionLoading, setMentionLoading] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const filtered = filter === "all"
        ? posts
        : filter === "solved"
            ? posts.filter((p) => p.solved)
            : posts.filter((p) => !p.solved);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setCreating(true);
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        if (pendingAttachments.length > 0) {
            formData.append("attachments", JSON.stringify(pendingAttachments));
        }
        await createPost(spaceId, formData);
        setPendingAttachments([]);
        setContent("");
        setCreating(false);
        setShowCreate(false);
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

    return (
        <div className="content-area">
            <div className="helper-banner">
                <strong>ingen dum fråga.</strong> seriously. ställ den, någon har garanterat undrat samma sak.
            </div>

            <div className="page-header">
                <div>
                    <h1 className="page-title">help &amp; questions</h1>
                    <p className="page-subtitle">fråga, svara, lär dig — prestige optional</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
                    + ask a question
                </button>
            </div>

            {showCreate && (
                <div className="card mb-4">
                    <div className="modal-title">new question</div>
                    <form className="auth-form" onSubmit={handleCreate}>
                        {pendingAttachments.length > 0 && (
                            <div className="mb-4">
                                <AttachmentList
                                    attachments={pendingAttachments}
                                    onRemove={(url) => setPendingAttachments(prev => prev.filter(a => a.url !== url))}
                                />
                            </div>
                        )}
                        <div className="form-group">
                            <div className="row-between mb-2">
                                <label className="form-label mb-0">title</label>
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
                            <input type="text" name="title" className="input" placeholder="what do you need help with?" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">details</label>
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
                                    name="content"
                                    className="input"
                                    placeholder="context, what you've tried, error messages..."
                                    required
                                    value={content}
                                    onChange={(e) => handleInputChange(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">tags (comma-separated)</label>
                            <input type="text" name="tags" className="input" placeholder="react, docker, auth" />
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={creating}>
                                {creating ? "posting..." : "post question"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="tabs">
                {(["all", "open", "solved"] as const).map((f) => (
                    <button
                        key={f}
                        className={`tab ${filter === f ? "active" : ""}`}
                        onClick={() => setFilter(f)}
                    >
                        {f} ({f === "all" ? posts.length : f === "solved" ? posts.filter((p) => p.solved).length : posts.filter((p) => !p.solved).length})
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">?</div>
                    <div className="empty-state-title">the collective knowledge is waiting</div>
                    <div className="empty-state-text">
                        every question asked helps us all grow. don&apos;t be shy — be the one who starts the conversation.
                    </div>
                </div>
            ) : (
                <div className="stack">
                    {filtered.map((post) => {
                        const isMentioned = currentUserName && post.content.toLowerCase().includes(`@${currentUserName.toLowerCase()}`);
                        return (
                            <Link
                                key={post.id}
                                href={`/spaces/${spaceId}/help/${post.id}`}
                                style={{ textDecoration: "none" }}
                            >
                                <div className={`card card-hover card-compact ${isMentioned ? "chat-message-mentioned" : ""}`}>
                                    <div className="row-between">
                                        <span className="font-semibold" style={{ color: "var(--text-bright)" }}>
                                            {post.title}
                                        </span>
                                        {post.solved ? (
                                            <span className="badge badge-green">✓ solved</span>
                                        ) : (
                                            <span className="badge badge-yellow">open</span>
                                        )}
                                    </div>
                                    <div className="text-sm text-secondary mt-2 line-clamp-2">
                                        <MessageContent content={post.content} currentUserName={currentUserName} />
                                    </div>
                                    <div className="row mt-2" style={{ gap: "var(--space-4)" }}>
                                        <span className="text-xs text-muted">by {post.user.name}</span>
                                        <span className="text-xs text-muted">{post.answerCount} answers</span>
                                        {post.tags.length > 0 && (
                                            <div className="tags-list">
                                                {post.tags.map((tag) => (
                                                    <span key={tag} className="tag">{tag}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
