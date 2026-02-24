"use client";

import { useState, useRef, useEffect } from "react";
import { addAnswer, markPostSolved, acceptAnswer } from "@/lib/actions/posts";
import AttachmentPicker from "@/components/attachment-picker";
import AttachmentList from "@/components/attachment-list";
import MessageContent from "@/components/message-content";
import MentionList from "@/components/mention-list";

interface Attachment {
    id?: string;
    url: string;
    name: string;
    mimeType: string;
    size: number;
}

interface Answer {
    id: string;
    content: string;
    accepted: boolean;
    createdAt: string;
    user: { id: string; name: string };
    attachments?: Attachment[];
}

interface Post {
    id: string;
    title: string;
    content: string;
    tags: string[];
    solved: boolean;
    userId: string;
    userName: string;
    createdAt: string;
    answers: Answer[];
    attachments?: Attachment[];
}

interface Props {
    spaceId: string;
    post: Post;
    currentUserId: string;
    currentUserName?: string;
}

export default function PostDetail({ spaceId, post, currentUserId, currentUserName }: Props) {
    const [answering, setAnswering] = useState(false);
    const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
    const [content, setContent] = useState("");

    // Mention state
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionUsers, setMentionUsers] = useState<{ id: string; name: string }[]>([]);
    const [mentionIndex, setMentionIndex] = useState(0);
    const [mentionLoading, setMentionLoading] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const isOwner = currentUserId === post.userId;

    async function handleAnswer(e: React.FormEvent) {
        e.preventDefault();
        setAnswering(true);
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        if (pendingAttachments.length > 0) {
            formData.append("attachments", JSON.stringify(pendingAttachments));
        }
        await addAnswer(post.id, spaceId, formData);
        setPendingAttachments([]);
        setContent("");
        setAnswering(false);
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

    const insertMention = (user: { id: string; name: string }) => {
        if (!inputRef.current) return;
        const cursorPosition = inputRef.current.selectionStart || 0;
        const textBeforeCursor = content.slice(0, cursorPosition);
        const textAfterCursor = content.slice(cursorPosition);
        const lastAtIndex = textBeforeCursor.lastIndexOf("@");

        const newText = textBeforeCursor.slice(0, lastAtIndex) + `@${user.name} ` + textAfterCursor;
        setContent(newText);
        setMentionQuery(null);

        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                const newPos = lastAtIndex + user.name.length + 2;
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

    const isPostMentioned = currentUserName && post.content.toLowerCase().includes(`@${currentUserName.toLowerCase()}`);

    return (
        <div className="content-area">
            <div className={`card mb-4 ${isPostMentioned ? "chat-message-mentioned" : ""}`}>
                <div className="row-between mb-4">
                    <div>
                        <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 700 }}>
                            {post.title}
                        </h2>
                        <div className="row mt-2" style={{ gap: "var(--space-4)" }}>
                            <span className="text-xs text-muted">av {post.userName}</span>
                            <span className="text-xs text-muted">
                                {new Date(post.createdAt).toLocaleDateString("sv-SE")}
                            </span>
                        </div>
                    </div>
                    <div className="row">
                        {post.solved ? (
                            <span className="badge badge-green">✓ löst</span>
                        ) : (
                            <>
                                <span className="badge badge-yellow">öppen</span>
                                {isOwner && (
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => markPostSolved(post.id, spaceId)}
                                    >
                                        markera som löst
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="text-secondary" style={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                    <MessageContent content={post.content} currentUserName={currentUserName} />
                </div>
                {post.attachments && post.attachments.length > 0 && (
                    <AttachmentList attachments={post.attachments} readOnly />
                )}

                {post.tags.length > 0 && (
                    <div className="tags-list mt-4">
                        {post.tags.map((tag) => (
                            <span key={tag} className="tag">{tag}</span>
                        ))}
                    </div>
                )}
            </div>

            {/* Answers */}
            <h3 className="page-title mb-4" style={{ fontSize: "var(--font-size-md)" }}>
                svar ({post.answers.length})
            </h3>

            <div className="stack mb-4">
                {post.answers.map((answer) => {
                    const isAnswerMentioned = currentUserName && answer.content.toLowerCase().includes(`@${currentUserName.toLowerCase()}`);
                    return (
                        <div
                            key={answer.id}
                            className={`card card-compact ${isAnswerMentioned ? "chat-message-mentioned" : ""}`}
                            style={{
                                borderLeft: answer.accepted
                                    ? "2px solid var(--neon-green)"
                                    : (isAnswerMentioned ? "3px solid var(--neon-magenta)" : "2px solid transparent"),
                            }}
                        >
                            <div className="row-between mb-2">
                                <div className="row">
                                    <span className="text-sm font-semibold text-cyan">
                                        {answer.user.name}
                                    </span>
                                    {answer.accepted && (
                                        <span className="badge badge-green">✓ accepterat</span>
                                    )}
                                </div>
                                <div className="row">
                                    <span className="text-xs text-muted">
                                        {new Date(answer.createdAt).toLocaleString("sv-SE")}
                                    </span>
                                    {isOwner && !answer.accepted && (
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => acceptAnswer(answer.id, post.id, spaceId)}
                                        >
                                            acceptera
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="text-sm text-secondary" style={{ lineHeight: 1.6 }}>
                                <MessageContent content={answer.content} currentUserName={currentUserName} />
                                {answer.attachments && answer.attachments.length > 0 && (
                                    <AttachmentList attachments={answer.attachments} readOnly />
                                )}
                            </div>
                        </div>
                    );
                })}
                {post.answers.length === 0 && (
                    <p className="text-muted text-sm">
                        inga svar än. bli hjälten!
                    </p>
                )}
            </div>

            <div className="card">
                <form className="auth-form" onSubmit={handleAnswer}>
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
                            <label className="form-label mb-0">ditt svar</label>
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
                                placeholder="dela med dig av vad du vet..."
                                required
                                value={content}
                                onChange={(e) => handleInputChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                style={{ minHeight: 80 }}
                            />
                        </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button type="submit" className="btn btn-primary" disabled={answering}>
                            {answering ? "publicerar..." : "skicka svar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
