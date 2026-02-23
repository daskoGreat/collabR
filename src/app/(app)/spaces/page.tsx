import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import { Suspense } from "react";
import { Skeleton, CardSkeleton } from "@/components/ui/loading-components";

export default async function NavetPage({ searchParams }: { searchParams: { view?: string } }) {
    const user = await requireAuth();
    const { view = "dashboard" } = searchParams;

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

            <div className="content-area">
                <div className="helper-banner mb-8">
                    <div className="text-lg mb-1"><strong>välkommen till kontoret, {user.name.split(" ")[0].toLowerCase()}.</strong></div>
                    det här är navet i vårt samarbete. här ser du vad som händer och vem som är här.
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

                <div className="grid-navet">
                    {/* Primary Content Area */}
                    <div className="min-h-[600px]">
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
                    <div className="sticky top-8 space-y-8 hidden lg:block">
                        <div className="section">
                            <h2 className="section-title">vilka är här?</h2>
                            <div className="card card-compact bg-primary/5 border-primary/20">
                                <div className="flex flex-wrap gap-2">
                                    {onlineUsers.length === 0 ? (
                                        <div className="text-xs text-muted italic">inga kollegor online just nu.</div>
                                    ) : (
                                        onlineUsers.map(u => (
                                            <div key={u.id} className="flex items-center gap-2 group p-1 pr-3 border border-transparent hover:border-subtle rounded transition-colors">
                                                <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_5px_var(--success)]" />
                                                <span className="text-xs font-medium group-hover:text-bright">{u.name.toLowerCase()}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {onlineUsers.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-subtle text-[9px] text-muted uppercase tracking-widest font-bold">
                                        {onlineUsers.length} kollegor aktiva
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="section">
                            <h2 className="section-title">system status</h2>
                            <div className="card card-compact text-[10px] space-y-2 opacity-60">
                                <div className="row-between">
                                    <span>anslutning</span>
                                    <span className="text-success">stabil</span>
                                </div>
                                <div className="row-between">
                                    <span>kryptering</span>
                                    <span className="text-success">aktiv</span>
                                </div>
                                <div className="row-between">
                                    <span>närvaro</span>
                                    <span className="text-success">synkroniserad</span>
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
        <div className="space-y-12">
            {/* Mentions are critical - always on dashboard */}
            <div className="section">
                <h2 className="section-title">senaste händelser</h2>
                <div className="stack">
                    {mentions.length === 0 ? (
                        <div className="p-8 border-dashed border-subtle rounded text-center">
                            <div className="text-2xl mb-2 opacity-20">✓</div>
                            <div className="text-xs text-muted italic">du är helt uppdaterad. inga nya omnämnanden.</div>
                        </div>
                    ) : (
                        mentions.map((m: any) => (
                            <Link key={m.id} href={
                                m.message ? `/spaces/${m.message.channel.spaceId}/chat/${m.message.channelId}` :
                                    m.directMessage ? `/dm/${m.directMessage.threadId}` :
                                        m.post ? `/spaces/${m.post.spaceId}/help/${m.post.id}` : "#"
                            } className="card card-hover card-compact border-l-2 border-l-primary/50">
                                <div className="row-between mb-1">
                                    <span className="text-[10px] text-muted font-bold uppercase tracking-wider">
                                        {m.message ? "chat" : m.directMessage ? "dm" : "hjälp"} • {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true, locale: sv })}
                                    </span>
                                </div>
                                <div className="text-sm">
                                    {m.message && <span>omnämnande i <strong>#{m.message.channel.name}</strong></span>}
                                    {m.directMessage && <span>nytt meddelande i en direktchatt</span>}
                                    {m.post && <span>omnämnande i tråden <strong>{m.post.title}</strong></span>}
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>

            <div className="grid-2">
                <div className="section">
                    <h2 className="section-title">puls: hjälp behövs</h2>
                    <div className="stack">
                        {latestHelp.length === 0 ? (
                            <div className="card card-compact text-muted text-xs italic p-4 border-dashed border-subtle">inga aktiva förfrågningar.</div>
                        ) : (
                            latestHelp.map((post: any) => (
                                <Link key={post.id} href={`/spaces/${post.spaceId}/help/${post.id}`} className="card card-hover card-compact">
                                    <div className="font-bold text-bright">{post.title}</div>
                                    <div className="row-between mt-1">
                                        <span className="text-[10px] text-muted font-mono lowercase">#{post.space.name}</span>
                                        <span className="text-[10px] text-muted">av {post.user.name.split(" ")[0]}</span>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                <div className="section">
                    <h2 className="section-title">senaste insikter</h2>
                    <div className="stack">
                        {latestFeed.length === 0 ? (
                            <div className="card card-compact text-muted text-xs italic p-4 border-dashed border-subtle">inga nya insikter.</div>
                        ) : (
                            latestFeed.map((post: any) => (
                                <Link key={post.id} href={`/feed/${post.id}`} className="card card-hover card-compact">
                                    <div className="text-xs text-secondary truncate">{post.content}</div>
                                    <div className="row-between mt-1">
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
            <div className="grid-2">
                {threads.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-muted italic">inga aktiva samarbeten än.</div>
                ) : (
                    threads.map((m: any) => {
                        const t = m.thread;
                        const otherMember = t.members.find((mem: any) => mem.userId !== user.id);
                        const name = t.isGroup ? (t.name || "Grupp") : (otherMember?.user.name || "Användare");
                        const lastMsg = t.messages[0];

                        return (
                            <Link key={t.id} href={`/dm/${t.id}`} className="card card-hover">
                                <div className="row-between mb-2">
                                    <span className="font-bold text-bright">{name.toLowerCase()}</span>
                                    <span className="text-[10px] text-muted uppercase">{formatDistanceToNow(new Date(t.createdAt), { locale: sv })}</span>
                                </div>
                                <div className="text-sm text-secondary line-clamp-2 min-h-[2.5em]">
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
        <div className="space-y-12">
            <div className="section">
                <h2 className="section-title">hjälp-puls</h2>
                <div className="grid-2">
                    {helpPosts.map((post: any) => (
                        <Link key={post.id} href={`/spaces/${post.spaceId}/help/${post.id}`} className="card card-hover">
                            <div className="text-[10px] text-primary font-bold uppercase mb-1">#{post.space.name}</div>
                            <div className="font-bold text-bright mb-2">{post.title}</div>
                            <div className="text-xs text-muted">postad av {post.user.name} • {formatDistanceToNow(new Date(post.createdAt), { locale: sv })} sedan</div>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="section">
                <h2 className="section-title">insikter & händelser</h2>
                <div className="stack">
                    {feedPosts.map((post: any) => (
                        <Link key={post.id} href={`/feed/${post.id}`} className="card card-hover card-compact">
                            <div className="text-sm mb-2">{post.content}</div>
                            <div className="row-between">
                                <span className="text-xs font-bold text-primary">{post.user.name.toLowerCase()}</span>
                                <span className="text-[10px] text-muted">{formatDistanceToNow(new Date(post.createdAt), { locale: sv })}</span>
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
            <div className="grid-2">
                {memberships.map(({ space }: any) => (
                    <Link key={space.id} href={`/spaces/${space.id}`} className="card card-hover">
                        <div className="row-between mb-4">
                            <h3 className="font-bold text-lg text-bright">
                                <span className="text-primary">#</span> {space.name.toLowerCase()}
                            </h3>
                            <div className="badge badge-muted">{space._count.members} medlemmar</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-[10px] text-muted uppercase tracking-wider">
                            <div>
                                <div className="font-bold text-secondary">{space._count.channels}</div>
                                kanaler
                            </div>
                            <div>
                                <div className="font-bold text-secondary">{space._count.tasks || 0}</div>
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
        <div className="space-y-12 animate-in fade-in duration-500">
            <div className="section">
                <Skeleton className="w-48 h-6 mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            </div>
            {view === "dashboard" && (
                <div className="section">
                    <Skeleton className="w-48 h-6 mb-6" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CardSkeleton />
                        <CardSkeleton />
                    </div>
                </div>
            )}
        </div>
    );
}
