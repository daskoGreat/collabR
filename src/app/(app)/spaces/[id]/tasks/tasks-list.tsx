"use client";

import { useState } from "react";
import BackButton from "@/components/back-button";
import { createTask, updateTaskStatus } from "@/lib/actions/tasks";
import Link from "next/link";
import MessageContent from "@/components/message-content";
import { Box } from "@/components/layout/Box";
import { Stack } from "@/components/layout/Stack";
import { Typography } from "@/components/ui/typography";
import { AvatarPreview } from "@/components/avatar-builder/AvatarPreview";

interface Task {
    id: string;
    title: string;
    description: string | null;
    status: string;
    tags: string[];
    assignee: { id: string; name: string; avatarId?: string } | null;
    creator: { name: string; avatarId?: string };
    commentCount: number;
    createdAt: string;
}

interface Props {
    spaceId: string;
    tasks: Task[];
    members: { id: string; name: string; avatarId?: string }[];
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
        try {
            await createTask(spaceId, formData);
            setShowCreate(false);
        } finally {
            setCreating(false);
        }
    }

    async function handleStatusChange(taskId: string, status: string) {
        await updateTaskStatus(taskId, spaceId, status as "OPEN" | "IN_PROGRESS" | "DONE");
    }

    return (
        <Box className="content-area">
            <Stack direction="horizontal" justify="between" align="center" style={{ marginBottom: '2rem' }}>
                <Box>
                    <Typography variant="h1" style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-outfit)' }}>Uppdrag</Typography>
                    <Typography style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Saker som behöver fixas eller utforskas.</Typography>
                </Box>
                <button
                    className="btn-premium"
                    onClick={() => setShowCreate(!showCreate)}
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '12px',
                        background: 'var(--neon-green)',
                        color: 'black',
                        fontWeight: 800,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 8px 30px rgba(0, 230, 118, 0.2)'
                    }}
                >
                    + nytt uppdrag
                </button>
            </Stack>

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
                                    <Stack direction="horizontal" gap={8} align="center">
                                        <Typography style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>av</Typography>
                                        <Stack direction="horizontal" gap={4} align="center">
                                            <AvatarPreview avatarId={task.creator.avatarId} name={task.creator.name} size={16} />
                                            <Typography style={{ fontSize: "0.85rem", fontWeight: 600 }}>{task.creator.name}</Typography>
                                        </Stack>

                                        {task.assignee && (
                                            <>
                                                <Typography style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", margin: "0 4px" }}>→</Typography>
                                                <Stack direction="horizontal" gap={4} align="center">
                                                    <AvatarPreview avatarId={task.assignee.avatarId} name={task.assignee.name} size={16} />
                                                    <Typography style={{ fontSize: "0.85rem", fontWeight: 600 }}>{task.assignee.name}</Typography>
                                                </Stack>
                                            </>
                                        )}

                                        {task.commentCount > 0 && <span style={{ marginLeft: "8px", fontSize: "0.85rem", opacity: 0.6 }}>💬 {task.commentCount}</span>}
                                    </Stack>

                                    {task.tags.length > 0 && (
                                        <div className="tags-list" style={{ marginTop: "12px" }}>
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
        </Box>
    );
}
