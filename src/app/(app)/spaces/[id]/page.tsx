import { requireSpaceMember } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import ChannelList from "./channel-list";
import BackButton from "@/components/back-button";
import { Building2, Users, User, Sparkles, HelpCircle, Hash } from "lucide-react";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function SpaceDetailPage({ params }: Props) {
    const { id } = await params;
    const currentUser = await requireSpaceMember(id);

    const space = await prisma.space.findUnique({
        where: { id },
        include: {
            channels: {
                where: {
                    OR: [
                        { isClosed: false },
                        { members: { some: { userId: currentUser.id } } }
                    ]
                },
                orderBy: { name: "asc" }
            },
            members: {
                include: { user: { select: { id: true, name: true } } }
            },
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

    // Can user manage channels?
    const canManage = currentUser.role === "ADMIN" || currentUser.role === "MODERATOR" ||
        !!(await prisma.spaceMember.findFirst({
            where: { spaceId: id, userId: currentUser.id, role: { in: ["ADMIN", "MODERATOR"] } },
        }));

    return (
        <>
            <div className="topbar">
                <div className="row" style={{ gap: "var(--space-4)" }}>
                    <BackButton />
                    <div className="topbar-title">
                        <Link href="/spaces" className="text-muted hover:text-primary transition-colors">navet</Link>
                        <span className="text-muted mx-2">/</span>
                        <span className="topbar-title-highlight flex items-center gap-1.5 backdrop-blur-sm bg-primary/20 px-2 py-0.5 rounded border border-subtle/50">
                            <Building2 size={13} strokeWidth={2} />
                            {space.name.toLowerCase()}
                        </span>
                    </div>
                </div>
                <div className="topbar-actions">
                    <span className="text-[10px] uppercase tracking-[0.14em] text-muted opacity-60 font-semibold">{space._count.members} medlemmar</span>
                </div>
            </div>
            <div className="content-area">
                <div className="max-w-6xl mx-auto">
                    <header className="mb-14">
                        <h1 className="page-title !text-4xl mb-3">{space.name.toLowerCase()}</h1>
                        {space.description && (
                            <p className="text-secondary text-[15px] max-w-2xl leading-relaxed italic opacity-70">
                                {space.description}
                            </p>
                        )}
                    </header>

                    <div className="grid lg:grid-cols-[1fr_320px] gap-12">
                        {/* Main Stream: Activity & Focus */}
                        <div className="space-y-12">
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="section-title !mb-0 text-bright">senaste aktivitet</h2>
                                    <Link href={`/spaces/${id}/audit`} className="btn-link text-[10px] uppercase tracking-wider">se logg</Link>
                                </div>

                                <div className="space-y-8">
                                    {recentTasks.length > 0 ? (
                                        <div className="stack gap-3">
                                            <div className="section-title text-[9px] !mb-2 opacity-40">senaste uppdrag</div>
                                            {recentTasks.map((task: any) => (
                                                <Link key={task.id} href={`/spaces/${id}/tasks/${task.id}`} className="card card-hover group !p-5 !py-4">
                                                    <div className="flex items-center justify-between gap-6">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-[15px] font-medium text-bright group-hover:text-accent-primary transition-colors truncate">
                                                                {task.title}
                                                            </div>
                                                            <div className="text-[10px] uppercase tracking-wider text-muted mt-1.5 flex items-center gap-2 opacity-60">
                                                                {task.assignee && (
                                                                    <span className="flex items-center gap-1.5">
                                                                        <User size={10} className="opacity-50" />
                                                                        {task.assignee.name.toLowerCase()}
                                                                    </span>
                                                                )}
                                                                <span className="opacity-20">/</span>
                                                                <span className="font-mono">task-{task.id.slice(-4)}</span>
                                                            </div>
                                                        </div>
                                                        <div className={`px-2 py-0.5 rounded-sm border text-[9px] font-bold uppercase tracking-widest ${task.status === "DONE" ? "bg-accent-success/5 border-accent-success/20 text-accent-success" :
                                                            task.status === "IN_PROGRESS" ? "bg-accent-warning/5 border-accent-warning/20 text-accent-warning" :
                                                                "bg-accent-secondary/5 border-accent-secondary/20 text-accent-secondary"
                                                            }`}>
                                                            {task.status.replace("_", " ")}
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="empty-state !py-12 bg-white/[0.01] border border-dashed border-subtle/30 rounded-lg">
                                            <div className="empty-state-text !text-xs opacity-40 italic">inga aktiva uppdrag just nu</div>
                                        </div>
                                    )}

                                    {recentPosts.length > 0 && (
                                        <div className="stack gap-3 mt-12">
                                            <div className="section-title text-[9px] !mb-2 opacity-40">frågor & diskussion</div>
                                            {recentPosts.map((post: any) => (
                                                <Link key={post.id} href={`/spaces/${id}/help/${post.id}`} className="card card-hover group !p-5 !py-4">
                                                    <div className="flex items-center justify-between gap-6">
                                                        <div className="min-w-0">
                                                            <div className="text-[15px] font-medium text-bright group-hover:text-accent-primary transition-colors truncate">{post.title}</div>
                                                            <div className="text-[10px] text-muted mt-1.5 uppercase tracking-widest opacity-60">av {post.user.name.toLowerCase()}</div>
                                                        </div>
                                                        {post.solved ? (
                                                            <div className="text-accent-success/50 group-hover:text-accent-success transition-colors">
                                                                <HelpCircle size={14} fill="currentColor" className="opacity-20" />
                                                            </div>
                                                        ) : (
                                                            <div className="text-[10px] font-bold text-accent-warning uppercase tracking-tighter bg-accent-warning/10 px-2 py-0.5 rounded-sm">
                                                                {post._count.answers} svar
                                                            </div>
                                                        )}
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Sidebar: Nav & Tools */}
                        <div className="space-y-10">
                            <section>
                                <h3 className="section-title text-sm uppercase tracking-widest text-muted mb-6">kanaler</h3>
                                <div className="card bg-secondary/30 border-subtle/50 !p-2">
                                    <ChannelList
                                        spaceId={id}
                                        channels={space.channels}
                                        canManage={canManage}
                                        members={space.members.map(m => ({ id: m.user.id, name: m.user.name }))}
                                    />
                                </div>
                            </section>

                            <section>
                                <h3 className="section-title text-sm uppercase tracking-widest text-muted mb-6">verktyg</h3>
                                <div className="stack gap-2">
                                    <Link href={`/spaces/${id}/members`} className="card card-hover !p-3 flex items-center justify-between text-sm group">
                                        <span className="group-hover:text-neon-green transition-colors flex items-center gap-2">
                                            <Users size={14} className="opacity-50" /> medlemmar
                                        </span>
                                        <span className="text-xs text-muted font-mono">{space._count.members}</span>
                                    </Link>
                                    <Link href={`/spaces/${id}/tasks`} className="card card-hover !p-3 flex items-center justify-between text-sm group">
                                        <span className="group-hover:text-neon-cyan transition-colors flex items-center gap-2">
                                            <Sparkles size={14} className="opacity-50" /> uppdrag
                                        </span>
                                        <span className="text-xs text-muted font-mono">{space._count.tasks}</span>
                                    </Link>
                                    <Link href={`/spaces/${id}/help`} className="card card-hover !p-3 flex items-center justify-between text-sm group">
                                        <span className="group-hover:text-neon-magenta transition-colors flex items-center gap-2">
                                            <HelpCircle size={14} className="opacity-50" /> hjälp & frågor
                                        </span>
                                        <span className="text-xs text-muted font-mono">{space._count.posts}</span>
                                    </Link>
                                    <Link href={`/spaces/${id}/files`} className="card card-hover !p-3 flex items-center justify-between text-sm group">
                                        <span className="group-hover:text-white transition-colors flex items-center gap-2">
                                            <Hash size={14} className="opacity-50" /> filer
                                        </span>
                                        <span className="text-xs text-muted font-mono">{space._count.files}</span>
                                    </Link>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
