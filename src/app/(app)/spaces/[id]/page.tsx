import { requireSpaceMember } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function SpaceDetailPage({ params }: Props) {
    const { id } = await params;
    await requireSpaceMember(id);

    const space = await prisma.space.findUnique({
        where: { id },
        include: {
            channels: { orderBy: { name: "asc" } },
            _count: { select: { members: true, tasks: true, posts: true, files: true } },
        },
    });

    if (!space) return notFound();

    const recentTasks = await prisma.task.findMany({
        where: { spaceId: id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { assignee: { select: { name: true } } },
    });

    const recentPosts = await prisma.post.findMany({
        where: { spaceId: id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { user: { select: { name: true } }, _count: { select: { answers: true } } },
    });

    return (
        <>
            <div className="topbar">
                <div className="topbar-title">
                    <span className="topbar-title-highlight">#</span> {space.name.toLowerCase()}
                </div>
                <div className="topbar-actions">
                    <span className="text-xs text-muted">{space._count.members} members</span>
                </div>
            </div>
            <div className="content-area">
                {space.description && (
                    <p className="text-secondary text-sm mb-4">{space.description}</p>
                )}

                <div className="stats-grid">
                    <div className="card stat-card">
                        <div className="stat-value">{space._count.members}</div>
                        <div className="stat-label">members</div>
                    </div>
                    <div className="card stat-card">
                        <div className="stat-value">{space.channels.length}</div>
                        <div className="stat-label">channels</div>
                    </div>
                    <div className="card stat-card">
                        <div className="stat-value">{space._count.tasks}</div>
                        <div className="stat-label">tasks</div>
                    </div>
                    <div className="card stat-card">
                        <div className="stat-value">{space._count.posts}</div>
                        <div className="stat-label">questions</div>
                    </div>
                </div>

                <div className="grid-2">
                    {/* Channels */}
                    <div>
                        <div className="row-between mb-4">
                            <h3 className="page-title" style={{ fontSize: "var(--font-size-md)" }}>
                                channels
                            </h3>
                        </div>
                        <div className="stack">
                            {space.channels.map((channel: typeof space.channels[number]) => (
                                <Link
                                    key={channel.id}
                                    href={`/spaces/${id}/chat/${channel.id}`}
                                    style={{ textDecoration: "none" }}
                                >
                                    <div className="card card-hover card-compact">
                                        <div className="font-semibold">
                                            <span className="text-neon">#</span>{" "}
                                            {channel.name.toLowerCase()}
                                        </div>
                                        {channel.description && (
                                            <div className="text-xs text-muted mt-2">
                                                {channel.description}
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))}
                            {space.channels.length === 0 && (
                                <div className="text-muted text-sm">no channels yet.</div>
                            )}
                        </div>
                    </div>

                    {/* Quick links */}
                    <div>
                        <div className="row-between mb-4">
                            <h3 className="page-title" style={{ fontSize: "var(--font-size-md)" }}>
                                quick nav
                            </h3>
                        </div>
                        <div className="stack">
                            <Link href={`/spaces/${id}/tasks`} style={{ textDecoration: "none" }}>
                                <div className="card card-hover card-compact">
                                    <div className="row-between">
                                        <span className="font-semibold">⊡ tasks</span>
                                        <span className="badge badge-cyan">{space._count.tasks}</span>
                                    </div>
                                </div>
                            </Link>
                            <Link href={`/spaces/${id}/help`} style={{ textDecoration: "none" }}>
                                <div className="card card-hover card-compact">
                                    <div className="row-between">
                                        <span className="font-semibold">? help &amp; questions</span>
                                        <span className="badge badge-magenta">{space._count.posts}</span>
                                    </div>
                                </div>
                            </Link>
                            <Link href={`/spaces/${id}/files`} style={{ textDecoration: "none" }}>
                                <div className="card card-hover card-compact">
                                    <div className="row-between">
                                        <span className="font-semibold">⊞ files</span>
                                        <span className="badge badge-muted">{space._count.files}</span>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Recent activity */}
                {recentTasks.length > 0 && (
                    <div className="mt-6">
                        <h3 className="page-title mb-4" style={{ fontSize: "var(--font-size-md)" }}>
                            recent tasks
                        </h3>
                        <div className="stack">
                            {recentTasks.map((task: typeof recentTasks[number]) => (
                                <Link
                                    key={task.id}
                                    href={`/spaces/${id}/tasks/${task.id}`}
                                    style={{ textDecoration: "none" }}
                                >
                                    <div className={`card card-hover card-compact task-card status-${task.status.toLowerCase().replace("_", "-")}`}>
                                        <div className="row-between">
                                            <span className="task-title">{task.title}</span>
                                            <span className={`badge ${task.status === "DONE" ? "badge-green" :
                                                task.status === "IN_PROGRESS" ? "badge-yellow" :
                                                    "badge-cyan"
                                                }`}>
                                                {task.status.toLowerCase().replace("_", " ")}
                                            </span>
                                        </div>
                                        <div className="task-meta mt-2">
                                            {task.assignee && <span>→ {task.assignee.name}</span>}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {recentPosts.length > 0 && (
                    <div className="mt-6">
                        <h3 className="page-title mb-4" style={{ fontSize: "var(--font-size-md)" }}>
                            recent questions
                        </h3>
                        <div className="stack">
                            {recentPosts.map((post: typeof recentPosts[number]) => (
                                <Link
                                    key={post.id}
                                    href={`/spaces/${id}/help/${post.id}`}
                                    style={{ textDecoration: "none" }}
                                >
                                    <div className="card card-hover card-compact">
                                        <div className="row-between">
                                            <span className="font-semibold">{post.title}</span>
                                            {post.solved ? (
                                                <span className="badge badge-green">solved</span>
                                            ) : (
                                                <span className="badge badge-yellow">{post._count.answers} answers</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted mt-2">
                                            by {post.user.name}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
