"use client";

import { useState } from "react";
import { createPost } from "@/lib/actions/posts";
import Link from "next/link";
import AttachmentPicker from "@/components/attachment-picker";
import AttachmentList from "@/components/attachment-list";

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
}

export default function HelpList({ spaceId, posts }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [filter, setFilter] = useState<"all" | "open" | "solved">("all");
    const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);

    const filtered = filter === "all"
        ? posts
        : filter === "solved"
            ? posts.filter((p) => p.solved)
            : posts.filter((p) => !p.solved);

    async function handleCreate(formData: FormData) {
        setCreating(true);
        if (pendingAttachments.length > 0) {
            formData.append("attachments", JSON.stringify(pendingAttachments));
        }
        await createPost(spaceId, formData);
        setPendingAttachments([]);
        setCreating(false);
        setShowCreate(false);
    }

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
                    <form className="auth-form" action={handleCreate}>
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
                            <textarea name="content" className="input" placeholder="context, what you've tried, error messages..." required />
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
                    <div className="empty-state-title">no questions yet</div>
                    <div className="empty-state-text">
                        be the first to ask. someone&apos;s got the answer.
                    </div>
                </div>
            ) : (
                <div className="stack">
                    {filtered.map((post) => (
                        <Link
                            key={post.id}
                            href={`/spaces/${spaceId}/help/${post.id}`}
                            style={{ textDecoration: "none" }}
                        >
                            <div className="card card-hover card-compact">
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
                                <p className="text-sm text-secondary mt-2" style={{ maxHeight: 40, overflow: "hidden" }}>
                                    {post.content}
                                </p>
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
                    ))}
                </div>
            )}
        </div>
    );
}
