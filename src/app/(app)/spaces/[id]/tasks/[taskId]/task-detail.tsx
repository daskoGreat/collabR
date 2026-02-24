"use client";

import { useState, useRef, useEffect } from "react";
import { updateTaskStatus, addTaskComment } from "@/lib/actions/tasks";
import BackButton from "@/components/back-button";
import AttachmentPicker from "@/components/attachment-picker";
import AttachmentList from "@/components/attachment-list";
import MessageContent from "@/components/message-content";
import MentionList from "@/components/mention-list";

interface Attachment {
    id: string;
    url: string;
    name: string;
    mimeType: string;
    size: number;
}

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; name: string };
    attachments?: Attachment[];
}

interface Task {
    id: string;
    title: string;
    description: string | null;
    status: string;
    tags: string[];
    assignee: { id: string; name: string } | null;
    creator: { name: string };
    createdAt: string;
    comments: Comment[];
}

interface Props {
    spaceId: string;
    task: Task;
    currentUserId: string;
    currentUserName?: string;
}

export default function TaskDetail({ spaceId, task, currentUserId, currentUserName }: Props) {
    const [commenting, setCommenting] = useState(false);
    const [pendingAttachments, setPendingAttachments] = useState<{ url: string; name: string; mimeType: string; size: number }[]>([]);
    const [content, setContent] = useState("");

    // Mention state
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionUsers, setMentionUsers] = useState<{ id: string; name: string }[]>([]);
    const [mentionIndex, setMentionIndex] = useState(0);
    const [mentionLoading, setMentionLoading] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    async function handleStatusChange(status: string) {
        await updateTaskStatus(task.id, spaceId, status as "OPEN" | "IN_PROGRESS" | "DONE");
    }

    async function handleComment(e: React.FormEvent) {
        e.preventDefault();
        setCommenting(true);
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        if (pendingAttachments.length > 0) {
            formData.append("attachments", JSON.stringify(pendingAttachments));
        }
        await addTaskComment(task.id, spaceId, formData);
        setPendingAttachments([]);
        setContent("");
        setCommenting(false);
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

    const isTaskMentioned = currentUserName && task.description?.toLowerCase().includes(`@${currentUserName.toLowerCase()}`);

    return (
        <div className="content-area">
            <div className="mb-4">
                <BackButton />
            </div>
            <div className={`card mb-4 ${isTaskMentioned ? "chat-message-mentioned" : ""}`}>
                <div className="row-between mb-4">
                    <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 700 }}>
                        {task.title}
                    </h2>
                    <select
                        className="select"
                        value={task.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                    >
                        <option value="OPEN">open</option>
                        <option value="IN_PROGRESS">in progress</option>
                        <option value="DONE">done</option>
                    </select>
                </div>

                {task.description && (
                    <div className="text-secondary mb-4" style={{ lineHeight: 1.6 }}>
                        <MessageContent content={task.description} currentUserName={currentUserName} />
                    </div>
                )}

                <div className="row" style={{ gap: "var(--space-5)", flexWrap: "wrap" }}>
                    {task.assignee && (
                        <div>
                            <span className="text-xs text-muted">assigned to: </span>
                            <span className="text-sm text-cyan">{task.assignee.name}</span>
                        </div>
                    )}
                    <div>
                        <span className="text-xs text-muted">created by: </span>
                        <span className="text-sm">{task.creator.name}</span>
                    </div>
                    <div>
                        <span className="text-xs text-muted">created: </span>
                        <span className="text-sm">
                            {new Date(task.createdAt).toLocaleDateString("sv-SE")}
                        </span>
                    </div>
                </div>

                {task.tags.length > 0 && (
                    <div className="tags-list mt-4">
                        {task.tags.map((tag) => (
                            <span key={tag} className="tag">{tag}</span>
                        ))}
                    </div>
                )}
            </div>

            {/* Comments */}
            <h3 className="page-title mb-4" style={{ fontSize: "var(--font-size-md)" }}>
                comments ({task.comments.length})
            </h3>

            <div className="stack mb-4">
                {task.comments.map((comment) => {
                    const isCommentMentioned = currentUserName && comment.content.toLowerCase().includes(`@${currentUserName.toLowerCase()}`);
                    return (
                        <div key={comment.id} className={`card card-compact ${isCommentMentioned ? "chat-message-mentioned" : ""}`}>
                            <div className="row-between mb-2">
                                <span className="text-sm font-semibold text-cyan">
                                    {comment.user.name}
                                </span>
                                <span className="text-xs text-muted">
                                    {new Date(comment.createdAt).toLocaleString("sv-SE")}
                                </span>
                            </div>
                            <div className="text-sm text-secondary" style={{ lineHeight: 1.5 }}>
                                <MessageContent content={comment.content} currentUserName={currentUserName} />
                                {comment.attachments && comment.attachments.length > 0 && (
                                    <AttachmentList attachments={comment.attachments} readOnly />
                                )}
                            </div>
                        </div>
                    );
                })}
                {task.comments.length === 0 && (
                    <p className="text-muted text-sm">no comments yet. break the silence.</p>
                )}
            </div>

            {/* Add comment form */}
            <div className="card">
                <form className="auth-form" onSubmit={handleComment}>
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
                            <label className="form-label mb-0">add comment</label>
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
                                placeholder="thoughts, updates, questions..."
                                style={{ minHeight: 80 }}
                                value={content}
                                onChange={(e) => handleInputChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button type="submit" className="btn btn-primary" disabled={commenting || (!pendingAttachments.length && !commenting)}>
                            {/* Keep the button enabled if there's text or attachments - simple check below */}
                            {commenting ? "posting..." : "post comment"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
