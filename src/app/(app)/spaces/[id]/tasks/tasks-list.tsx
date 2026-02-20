"use client";

import { useState } from "react";
import { createTask, updateTaskStatus } from "@/lib/actions/tasks";
import Link from "next/link";

interface Task {
    id: string;
    title: string;
    description: string | null;
    status: string;
    tags: string[];
    assignee: { id: string; name: string } | null;
    creator: { name: string };
    commentCount: number;
    createdAt: string;
}

interface Props {
    spaceId: string;
    tasks: Task[];
    members: { id: string; name: string }[];
    currentUserId: string;
}

export default function TasksList({ spaceId, tasks, members }: Props) {
    const [filter, setFilter] = useState<string>("ALL");
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);

    const filtered = filter === "ALL"
        ? tasks
        : tasks.filter((t) => t.status === filter);

    async function handleCreate(formData: FormData) {
        setCreating(true);
        await createTask(spaceId, formData);
        setCreating(false);
        setShowCreate(false);
    }

    async function handleStatusChange(taskId: string, status: string) {
        await updateTaskStatus(taskId, spaceId, status as "OPEN" | "IN_PROGRESS" | "DONE");
    }

    return (
        <div className="content-area">
            <div className="page-header">
                <div>
                    <h1 className="page-title">tasks</h1>
                    <p className="page-subtitle">uppdrag, grejer att göra, saker att fixa</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
                    + new task
                </button>
            </div>

            {/* Create form */}
            {showCreate && (
                <div className="card mb-4">
                    <div className="modal-title">new task</div>
                    <form className="auth-form" action={handleCreate}>
                        <div className="form-group">
                            <label className="form-label">title</label>
                            <input type="text" name="title" className="input" placeholder="what needs doing?" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">description</label>
                            <textarea name="description" className="input" placeholder="details, context, whatever helps..." />
                        </div>
                        <div className="row">
                            <div className="form-group flex-1">
                                <label className="form-label">tags (comma-separated)</label>
                                <input type="text" name="tags" className="input" placeholder="bug, feature, docs" />
                            </div>
                            <div className="form-group flex-1">
                                <label className="form-label">assign to</label>
                                <select name="assigneeId" className="select w-full">
                                    <option value="">unassigned</option>
                                    {members.map((m) => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                                cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={creating}>
                                {creating ? "creating..." : "create task"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="tabs">
                {["ALL", "OPEN", "IN_PROGRESS", "DONE"].map((s) => (
                    <button
                        key={s}
                        className={`tab ${filter === s ? "active" : ""}`}
                        onClick={() => setFilter(s)}
                    >
                        {s === "ALL" ? "all" : s.toLowerCase().replace("_", " ")} ({s === "ALL" ? tasks.length : tasks.filter((t) => t.status === s).length})
                    </button>
                ))}
            </div>

            {/* Task list */}
            {filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">⊡</div>
                    <div className="empty-state-title">no tasks here</div>
                    <div className="empty-state-text">
                        nothing to do? unlikely. create one.
                    </div>
                </div>
            ) : (
                <div className="stack">
                    {filtered.map((task) => (
                        <div key={task.id} className={`card card-hover card-compact task-card status-${task.status.toLowerCase().replace("_", "-")}`}>
                            <div className="row-between">
                                <Link
                                    href={`/spaces/${spaceId}/tasks/${task.id}`}
                                    style={{ textDecoration: "none", flex: 1 }}
                                >
                                    <span className="task-title">{task.title}</span>
                                </Link>
                                <select
                                    className="select"
                                    value={task.status}
                                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                    style={{ minWidth: 120 }}
                                >
                                    <option value="OPEN">open</option>
                                    <option value="IN_PROGRESS">in progress</option>
                                    <option value="DONE">done</option>
                                </select>
                            </div>
                            {task.description && (
                                <p className="text-sm text-secondary mt-2" style={{ maxHeight: 60, overflow: "hidden" }}>
                                    {task.description}
                                </p>
                            )}
                            <div className="task-meta mt-2">
                                {task.assignee && <span>→ {task.assignee.name}</span>}
                                <span>by {task.creator.name}</span>
                                {task.commentCount > 0 && <span>💬 {task.commentCount}</span>}
                                {task.tags.length > 0 && (
                                    <div className="tags-list">
                                        {task.tags.map((tag) => (
                                            <span key={tag} className="tag">{tag}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
