import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import { Suspense } from "react";
import { Skeleton, CardSkeleton } from "@/components/ui/loading-components";

export default async function NavetPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
    const user = await requireAuth();
    const { view = "dashboard" } = await searchParams;

    // ... memberships and onlineUsers fetching (kept for sidebar)

    // Common data
    const memberships = await prisma.spaceMember.findMany({
        where: { userId: user.id },
        include: {
            space: {
                include: {
                    _count: { select: { members: true, channels: true, tasks: true } },
                },
            },
        },
        orderBy: { space: { name: "asc" } },
    });

    const spaceIds = memberships.map(m => m.spaceId);

    // Online users (global)
    const now = new Date();
    const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;
    const onlineUsers = await prisma.user.findMany({
        where: {
            lastSeenAt: { gt: new Date(now.getTime() - ONLINE_THRESHOLD_MS) },
            id: { not: user.id }
        },
        select: { id: true, name: true },
        take: 12
    });

    // Unread mentions (global)
    const mentions = await prisma.mention.findMany({
        where: { userId: user.id, readAt: null },
        include: {
            message: { include: { channel: true } },
            directMessage: { include: { thread: true } },
            post: true,
            task: true
        },
        orderBy: { createdAt: "desc" },
        take: 5
    });

    return (
        <>
            <div className="topbar">
                <div className="topbar-title">
                    <span className="topbar-title-highlight">$</span> navet
                </div>
            </div>

            <div className="content-area max-w-[1400px] mx-auto">
                <div className="helper-banner mb-10 p-6 bg-tertiary/50 border border-subtle rounded-lg flex items-center justify-between">
                    <div>
                        <div className="text-xl font-bold text-bright mb-1 lowercase">välkommen till kontoret, {user.name.split(" ")[0]}.</div>
                        <div className="text-sm text-secondary italic">det här är navet i vårt samarbete. här ser du vad som händer och vem som är här.</div>
                    </div>
                </div>

                <div className="mb-8 overflow-x-auto pb-2">
                    <div className="tabs">
                        <Link href="?view=dashboard" className={`tab ${view === "dashboard" ? "active" : ""}`}>
                            dashboard
                        </Link>
                        <Link href="?view=collaborations" className={`tab ${view === "collaborations" ? "active" : ""}`}>
                            samarbeten
                        </Link>
                        <Link href="?view=pulse" className={`tab ${view === "pulse" ? "active" : ""}`}>
                            puls
                        </Link>
                        <Link href="?view=offices" className={`tab ${view === "offices" ? "active" : ""}`}>
                            dina kontor
                        </Link>
                    </div>
                </div>

                <div className="grid-navet gap-12">
                    {/* Primary Content Area */}
                    <div className="min-h-[600px] space-y-12">
                        <Suspense key={view} fallback={<NavetSkeleton view={view} />}>
                            {view === "dashboard" && (
                                <DashboardView
                                    user={user}
                                    spaceIds={spaceIds}
                                    mentions={mentions}
                                    memberships={memberships}
                                />
                            )}
                            {view === "collaborations" && (
                                <CollaborationsView user={user} />
                            )}
                            {view === "pulse" && (
                                <PulseView spaceIds={spaceIds} />
                            )}
                            {view === "offices" && (
                                <OfficesView memberships={memberships} />
                            )}
                        </Suspense>
                    </div>

                    {/* Sidebar / Pulse Area */}
                    <div className="sticky top-8 space-y-10 hidden lg:block">
                        <div className="section">
                            <h2 className="section-title mb-4">vilka är här?</h2>
                            <div className="card card-compact bg-success/[0.02] border-success/10 p-5">
                                <div className="flex flex-wrap gap-x-4 gap-y-3">
                                    {onlineUsers.length === 0 ? (
                                        <div className="text-xs text-muted italic">inga kollegor online just nu.</div>
                                    ) : (
                                        onlineUsers.map(u => (
                                            <div key={u.id} className="flex items-center gap-2 group transition-opacity hover:opacity-100 opacity-80">
                                                <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_var(--success)]" />
                                                <span className="text-xs font-medium text-bright">{u.name.toLowerCase()}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {onlineUsers.length > 0 && (
                                    <div className="mt-6 pt-4 border-t border-subtle text-[9px] text-muted uppercase tracking-[0.2em] font-bold">
                                        {onlineUsers.length} kollegor aktiva
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="section">
                            <h2 className="section-title mb-4">system status</h2>
                            <div className="card card-compact bg-tertiary/30 border-subtle/30 p-5">
                                <div className="space-y-3 text-[10px] uppercase tracking-widest font-bold">
                                    <div className="row-between">
                                        <span className="text-muted">anslutning</span>
                                        <span className="text-success shadow-[0_0_10px_var(--success)]">stabil</span>
                                    </div>
                                    <div className="row-between">
                                        <span className="text-muted">närvaro</span>
                                        <span className="text-success">aktiv</span>
                                    </div>
                                    <div className="row-between">
                                        <span className="text-muted">kryptering</span>
                                        <span className="text-primary opacity-50">aes-256</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

async function DashboardView({ user, spaceIds, mentions, memberships }: any) {
    const latestHelp = await prisma.post.findMany({
        where: { spaceId: { in: spaceIds }, solved: false },
        take: 2,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } }, space: { select: { name: true } } }
    });

    const latestFeed = await prisma.feedPost.findMany({
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 2
    });

    return (
        <div className="space-y-16">
            {/* Mentions are critical - always on dashboard */}
            <div className="section">
                <h2 className="section-title">senaste händelser</h2>
                <div className="stack gap-3">
                    {mentions.length === 0 ? (
                        <div className="p-10 border-dashed border-subtle rounded-lg text-center bg-tertiary/10">
                            <div className="text-3xl mb-3 opacity-10">✓</div>
                            <div className="text-xs text-muted font-medium italic">du är helt uppdaterad. inga nya omnämnanden.</div>
                        </div>
                    ) : (
                        mentions.map((m: any) => (
                            <Link key={m.id} href={
                                m.message ? `/spaces/${m.message.channel.spaceId}/chat/${m.message.channelId}` :
                                    m.directMessage ? `/dm/${m.directMessage.threadId}` :
                                        m.post ? `/spaces/${m.post.spaceId}/help/${m.post.id}` : "#"
                            } className="card card-hover card-compact group">
                                <div className="row-between mb-2">
                                    <span className="text-[10px] text-muted font-bold uppercase tracking-[0.1em]">
                                        {m.message ? "chat" : m.directMessage ? "dm" : "hjälp"} • {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true, locale: sv })}
                                    </span>
                                </div>
                                <div className="text-sm text-bright group-hover:text-primary transition-colors">
                                    {m.message && <span>omnämnande i <strong className="text-primary">#{m.message.channel.name}</strong></span>}
                                    {m.directMessage && <span>nytt meddelande i en direktchatt</span>}
                                    {m.post && <span>omnämnande i tråden <strong className="text-primary">{m.post.title}</strong></span>}
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>

            <div className="grid-2 gap-8">
                <div className="section">
                    <h2 className="section-title">puls: hjälp behövs</h2>
                    <div className="stack gap-3">
                        {latestHelp.length === 0 ? (
                            <div className="card card-compact text-muted text-xs italic p-6 border-dashed border-subtle bg-tertiary/5">inga aktiva förfrågningar.</div>
                        ) : (
                            latestHelp.map((post: any) => (
                                <Link key={post.id} href={`/spaces/${post.spaceId}/help/${post.id}`} className="card card-hover card-compact min-h-[100px] flex flex-col justify-between">
                                    <div className="font-bold text-bright line-clamp-2 mb-2">{post.title}</div>
                                    <div className="row-between mt-auto pt-2 border-t border-subtle/30">
                                        <span className="text-[10px] text-primary font-mono lowercase">#{post.space.name}</span>
                                        <span className="text-[10px] text-muted">av {post.user.name.split(" ")[0]}</span>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                <div className="section">
                    <h2 className="section-title">senaste insikter</h2>
                    <div className="stack gap-3">
                        {latestFeed.length === 0 ? (
                            <div className="card card-compact text-muted text-xs italic p-6 border-dashed border-subtle bg-tertiary/5">inga nya insikter.</div>
                        ) : (
                            latestFeed.map((post: any) => (
                                <Link key={post.id} href={`/feed/${post.id}`} className="card card-hover card-compact min-h-[100px] flex flex-col justify-between">
                                    <div className="text-xs text-secondary line-clamp-3 leading-relaxed">{post.content}</div>
                                    <div className="row-between mt-auto pt-2 border-t border-subtle/30">
                                        <span className="text-[10px] font-bold text-primary">{post.user.name.toLowerCase()}</span>
                                        <span className="text-[10px] text-muted">{formatDistanceToNow(new Date(post.createdAt), { locale: sv })}</span>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

async function CollaborationsView({ user }: any) {
    const threads = await prisma.threadMember.findMany({
        where: { userId: user.id },
        include: {
            thread: {
                include: {
                    members: { include: { user: { select: { name: true } } } },
                    messages: { take: 1, orderBy: { createdAt: "desc" } }
                }
            }
        },
        orderBy: { joinedAt: "desc" }
    });

    return (
        <div className="section">
            <h2 className="section-title">pågående samarbeten</h2>
            <div className="grid-2 gap-6">
                {threads.length === 0 ? (
                    <div className="col-span-full py-16 text-center bg-tertiary/10 rounded-lg border border-dashed border-subtle">
                        <div className="text-xs text-muted italic">inga aktiva samarbeten än. starta en konversation i en kanal eller via dm.</div>
                    </div>
                ) : (
                    threads.map((m: any) => {
                        const t = m.thread;
                        const otherMember = t.members.find((mem: any) => mem.userId !== user.id);
                        const name = t.isGroup ? (t.name || "Grupp") : (otherMember?.user.name || "Användare");
                        const lastMsg = t.messages[0];

                        return (
                            <Link key={t.id} href={`/dm/${t.id}`} className="card card-hover p-6">
                                <div className="row-between mb-3 pb-2 border-b border-subtle/30">
                                    <span className="font-bold text-bright lowercase tracking-wider">{name}</span>
                                    <span className="text-[10px] text-muted uppercase tracking-tighter">{formatDistanceToNow(new Date(t.createdAt), { locale: sv })}</span>
                                </div>
                                <div className="text-sm text-secondary line-clamp-2 min-h-[3em] leading-relaxed">
                                    {lastMsg ? lastMsg.content : "inga meddelanden än."}
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}

async function PulseView({ spaceIds }: any) {
    const helpPosts = await prisma.post.findMany({
        where: { spaceId: { in: spaceIds }, solved: false },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } }, space: { select: { name: true } } }
    });

    const feedPosts = await prisma.feedPost.findMany({
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10
    });

    return (
        <div className="space-y-16">
            <div className="section">
                <h2 className="section-title">hjälp-puls</h2>
                <div className="grid-2 gap-8">
                    {helpPosts.map((post: any) => (
                        <Link key={post.id} href={`/spaces/${post.spaceId}/help/${post.id}`} className="card card-hover p-6">
                            <div className="text-[10px] text-primary font-bold uppercase tracking-widest mb-2 opacity-70">#{post.space.name}</div>
                            <div className="font-bold text-lg text-bright mb-4 leading-tight">{post.title}</div>
                            <div className="text-xs text-secondary mt-auto">
                                postad av <span className="text-primary font-bold">{post.user.name}</span> • {formatDistanceToNow(new Date(post.createdAt), { locale: sv })} sedan
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="section">
                <h2 className="section-title">insikter & händelser</h2>
                <div className="stack gap-4">
                    {feedPosts.map((post: any) => (
                        <Link key={post.id} href={`/feed/${post.id}`} className="card card-hover card-compact group">
                            <div className="text-sm text-bright group-hover:text-primary transition-colors mb-3 leading-relaxed">{post.content}</div>
                            <div className="row-between pt-2 border-t border-subtle/30">
                                <span className="text-xs font-bold text-secondary uppercase italic">{post.user.name}</span>
                                <span className="text-[10px] text-muted">{formatDistanceToNow(new Date(post.createdAt), { locale: sv })} sedan</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

function OfficesView({ memberships }: any) {
    return (
        <div className="section">
            <h2 className="section-title">dina kontor</h2>
            <div className="grid-2 gap-6">
                {memberships.map(({ space }: any) => (
                    <Link key={space.id} href={`/spaces/${space.id}`} className="card card-hover p-6 border-l-2 border-l-primary/30 hover:border-l-primary transition-all">
                        <div className="row-between mb-6">
                            <h3 className="font-bold text-lg text-bright tracking-tight">
                                <span className="text-primary opacity-50 mr-1">#</span>{space.name.toLowerCase()}
                            </h3>
                            <div className="badge badge-primary opacity-60">{space._count.members}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-[10px] text-muted uppercase tracking-[0.15em] font-bold">
                            <div className="bg-tertiary/30 p-2 rounded">
                                <div className="text-secondary mb-1">{space._count.channels}</div>
                                kanaler
                            </div>
                            <div className="bg-tertiary/30 p-2 rounded">
                                <div className="text-secondary mb-1">{space._count.tasks || 0}</div>
                                uppdrag
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

function NavetSkeleton({ view }: { view: string }) {
    return (
        <div className="space-y-16 animate-in fade-in duration-500">
            <div className="section">
                <Skeleton className="w-48 h-5 mb-8 opacity-20" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <CardSkeleton className="min-h-[140px]" />
                    <CardSkeleton className="min-h-[140px]" />
                </div>
            </div>
            {view === "dashboard" && (
                <div className="section">
                    <Skeleton className="w-48 h-5 mb-8 opacity-20" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <CardSkeleton className="min-h-[120px]" />
                        <CardSkeleton className="min-h-[120px]" />
                    </div>
                </div>
            )}
        </div>
    );
}
