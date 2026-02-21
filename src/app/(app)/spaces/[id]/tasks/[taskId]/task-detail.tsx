"use client";

import { useState } from "react";
import { updateTaskStatus, addTaskComment } from "@/lib/actions/tasks";
import BackButton from "@/components/back-button";

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; name: string };
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
}

export default function TaskDetail({ spaceId, task, currentUserId }: Props) {
    const [commenting, setCommenting] = useState(false);

    async function handleStatusChange(status: string) {
        await updateTaskStatus(task.id, spaceId, status as "OPEN" | "IN_PROGRESS" | "DONE");
    }

    async function handleComment(formData: FormData) {
        setCommenting(true);
        await addTaskComment(task.id, spaceId, formData);
        setCommenting(false);
    }

    return (
        <div className="content-area">
            <div className="mb-4">
                <BackButton />
            </div>
            <div className="card mb-4">
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
                    <p className="text-secondary" style={{ lineHeight: 1.6, marginBottom: "var(--space-4)" }}>
                        {task.description}
                    </p>
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
                {task.comments.map((comment) => (
                    <div key={comment.id} className="card card-compact">
                        <div className="row-between mb-2">
                            <span className="text-sm font-semibold text-cyan">
                                {comment.user.name}
                            </span>
                            <span className="text-xs text-muted">
                                {new Date(comment.createdAt).toLocaleString("sv-SE")}
                            </span>
                        </div>
                        <p className="text-sm text-secondary" style={{ lineHeight: 1.5 }}>
                            {comment.content}
                        </p>
                    </div>
                ))}
                {task.comments.length === 0 && (
                    <p className="text-muted text-sm">no comments yet. break the silence.</p>
                )}
            </div>

            {/* Add comment form */}
            <div className="card">
                <form className="auth-form" action={handleComment}>
                    <div className="form-group">
                        <label className="form-label">add comment</label>
                        <textarea
                            name="content"
                            className="input"
                            placeholder="thoughts, updates, questions..."
                            required
                            style={{ minHeight: 80 }}
                        />
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button type="submit" className="btn btn-primary" disabled={commenting}>
                            {commenting ? "posting..." : "post comment"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
