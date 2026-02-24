"use client";

import { useState } from "react";
import BackButton from "@/components/back-button";
import { createTask, updateTaskStatus } from "@/lib/actions/tasks";
import Link from "next/link";
import MessageContent from "@/components/message-content";

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
    currentUserName?: string;
}

export default function TasksList({ spaceId, tasks, members, currentUserName }: Props) {
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
            <div className="mb-4">
                <BackButton />
            </div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">uppdrag</h1>
                    <p className="page-subtitle">uppdrag, grejer att göra, saker att fixa</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
                    + nytt uppdrag
                </button>
            </div>

            {/* Create form */}
            {showCreate && (
                <div className="card mb-4">
                    <div className="modal-title">nytt uppdrag</div>
                    <form className="auth-form" action={handleCreate}>
                        <div className="form-group">
                            <label className="form-label">rubrik</label>
                            <input type="text" name="title" className="input" placeholder="vad behöver göras?" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">beskrivning</label>
                            <textarea name="description" className="input" placeholder="detaljer, sammanhang, vad som helst som hjälper..." />
                        </div>
                        <div className="row">
                            <div className="form-group flex-1">
                                <label className="form-label">taggar (komma-separerade)</label>
                                <input type="text" name="tags" className="input" placeholder="bug, feature, docs" />
                            </div>
                            <div className="form-group flex-1">
                                <label className="form-label">tilldela till</label>
                                <select name="assigneeId" className="select w-full">
                                    <option value="">otilldelad</option>
                                    {members.map((m) => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                                avbryt
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={creating}>
                                {creating ? "skapar..." : "skapa uppdrag"}
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
                        {s === "ALL" ? "alla" : s === "OPEN" ? "öppna" : s === "IN_PROGRESS" ? "pågående" : "klara"} ({s === "ALL" ? tasks.length : tasks.filter((t) => t.status === s).length})
                    </button>
                ))}
            </div>

            {/* Task list */}
            {filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">⊡</div>
                    <div className="empty-state-title">fri sikt</div>
                    <div className="empty-state-text">
                        inget bråttom på radarn? hör av dig till en kollega och se var du kan hjälpa till.
                    </div>
                </div>
            ) : (
                <div className="stack">
                    {filtered.map((task) => {
                        const isMentioned = currentUserName && task.description?.toLowerCase().includes(`@${currentUserName.toLowerCase()}`);
                        return (
                            <div key={task.id} className={`card card-hover card-compact task-card status-${task.status.toLowerCase().replace("_", "-")} ${isMentioned ? "chat-message-mentioned" : ""}`}>
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
                                        <option value="OPEN">öppen</option>
                                        <option value="IN_PROGRESS">pågående</option>
                                        <option value="DONE">klar</option>
                                    </select>
                                </div>
                                {task.description && (
                                    <div className="text-sm text-secondary mt-2 line-clamp-2">
                                        <MessageContent content={task.description} currentUserName={currentUserName} />
                                    </div>
                                )}
                                <div className="task-meta mt-2">
                                    {task.assignee && <span>→ {task.assignee.name}</span>}
                                    <span>av {task.creator.name}</span>
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
                        );
                    })}
                </div>
            )}
        </div>
    );
}
