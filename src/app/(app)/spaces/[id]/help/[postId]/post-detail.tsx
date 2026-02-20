"use client";

import { useState } from "react";
import { addAnswer, markPostSolved, acceptAnswer } from "@/lib/actions/posts";

interface Answer {
    id: string;
    content: string;
    accepted: boolean;
    createdAt: string;
    user: { id: string; name: string };
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
}

interface Props {
    spaceId: string;
    post: Post;
    currentUserId: string;
}

export default function PostDetail({ spaceId, post, currentUserId }: Props) {
    const [answering, setAnswering] = useState(false);
    const isOwner = currentUserId === post.userId;

    async function handleAnswer(formData: FormData) {
        setAnswering(true);
        await addAnswer(post.id, spaceId, formData);
        setAnswering(false);
    }

    return (
        <div className="content-area">
            <div className="card mb-4">
                <div className="row-between mb-4">
                    <div>
                        <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 700 }}>
                            {post.title}
                        </h2>
                        <div className="row mt-2" style={{ gap: "var(--space-4)" }}>
                            <span className="text-xs text-muted">by {post.userName}</span>
                            <span className="text-xs text-muted">
                                {new Date(post.createdAt).toLocaleDateString("sv-SE")}
                            </span>
                        </div>
                    </div>
                    <div className="row">
                        {post.solved ? (
                            <span className="badge badge-green">✓ solved</span>
                        ) : (
                            <>
                                <span className="badge badge-yellow">open</span>
                                {isOwner && (
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => markPostSolved(post.id, spaceId)}
                                    >
                                        mark solved
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <p className="text-secondary" style={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                    {post.content}
                </p>

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
                answers ({post.answers.length})
            </h3>

            <div className="stack mb-4">
                {post.answers.map((answer) => (
                    <div
                        key={answer.id}
                        className="card card-compact"
                        style={{
                            borderLeft: answer.accepted
                                ? "2px solid var(--neon-green)"
                                : "2px solid transparent",
                        }}
                    >
                        <div className="row-between mb-2">
                            <div className="row">
                                <span className="text-sm font-semibold text-cyan">
                                    {answer.user.name}
                                </span>
                                {answer.accepted && (
                                    <span className="badge badge-green">✓ accepted</span>
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
                                        accept
                                    </button>
                                )}
                            </div>
                        </div>
                        <p className="text-sm text-secondary" style={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                            {answer.content}
                        </p>
                    </div>
                ))}
                {post.answers.length === 0 && (
                    <p className="text-muted text-sm">
                        no answers yet. be the hero.
                    </p>
                )}
            </div>

            {/* Answer form */}
            <div className="card">
                <form className="auth-form" action={handleAnswer}>
                    <div className="form-group">
                        <label className="form-label">your answer</label>
                        <textarea
                            name="content"
                            className="input"
                            placeholder="share what you know..."
                            required
                            style={{ minHeight: 80 }}
                        />
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button type="submit" className="btn btn-primary" disabled={answering}>
                            {answering ? "posting..." : "post answer"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
