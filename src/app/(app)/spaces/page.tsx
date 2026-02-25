import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import { Suspense } from "react";
import { Sparkles, Building2 } from "lucide-react";
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
                <div className="mb-14 p-8 bg-gradient-to-br from-tertiary/60 to-transparent border border-subtle/50 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Sparkles size={120} className="text-primary" />
                    </div>
                    <div className="relative z-10">
                        <h1 className="text-3xl font-medium text-bright mb-3 lowercase tracking-tight opacity-90">välkommen till navet, {user.name.split(" ")[0].toLowerCase()}.</h1>
                        <p className="text-[14px] text-secondary max-w-2xl leading-relaxed italic opacity-70">
                            detta är din centrala nod. här konvergerar händelser, samarbeten och insikter till en sammanhängande bild av verksamheten.
                        </p>
                    </div>
                </div>

                <div className="mb-10">
                    <div className="tabs tabs-primary mb-4 p-2">
                        <Link href="?view=dashboard" className={`tab ${view === "dashboard" ? "active" : ""}`}>
                            överblick
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
                    <div className="px-2 text-xs text-muted italic font-medium">
                        {view === "dashboard" && "👉 se vad som kräver uppmärksamhet nu"}
                        {view === "collaborations" && "👉 se aktiva sammanhang och personliga chatter"}
                        {view === "pulse" && "👉 besvara / granska frågor och gemensam aktivitet"}
                        {view === "offices" && "👉 navigera och hantera dina olika arbetsytor"}
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
                                    onlineUsers={onlineUsers}
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
                            <h2 className="section-title mb-4">medlemmar online</h2>
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
                            <h2 className="section-title mb-4">systemstatus</h2>
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

async function DashboardView({ user, spaceIds, mentions, memberships, onlineUsers }: any) {
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
        <div className="space-y-24 pb-12">
            {/* THINGS TO ACT ON */}
            <section>
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary/40 border border-primary/10">
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-light text-bright lowercase tracking-tight">prioriterad uppmärksamhet</h2>
                        <p className="text-[9px] text-muted uppercase tracking-[0.3em] font-black opacity-40">things to act on</p>
                    </div>
                    <span className="h-[1px] flex-1 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent ml-6" />
                </div>

                <div className="grid-2 gap-10">
                    <div className="space-y-6">
                        <h3 className="section-title px-1">senaste händelser & omnämnanden</h3>
                        <div className="stack gap-3">
                            {mentions.length === 0 ? (
                                <div className="empty-state !py-12 bg-white/[0.01] border border-dashed border-subtle/30 rounded-xl">
                                    <div className="empty-state-icon !text-3xl opacity-10">⌨</div>
                                    <div className="empty-state-title !text-xs opacity-50">allt är läst</div>
                                </div>
                            ) : (
                                mentions.map((m: any) => (
                                    <Link key={m.id} href={
                                        m.message ? `/spaces/${m.message.channel.spaceId}/chat/${m.message.channelId}` :
                                            m.directMessage ? `/dm/${m.directMessage.threadId}` :
                                                m.post ? `/spaces/${m.post.spaceId}/help/${m.post.id}` : "#"
                                    } className="card card-hover card-compact group !p-4">
                                        <div className="row-between mb-1">
                                            <span className="text-[9px] text-muted font-bold uppercase tracking-tight">
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

                    <div className="space-y-6">
                        <h3 className="section-title px-1">puls: hjälp behövs</h3>
                        <div className="stack gap-3">
                            {latestHelp.length === 0 ? (
                                <div className="empty-state !py-12 bg-white/[0.01] border border-dashed border-subtle/30 rounded-xl">
                                    <div className="empty-state-icon !text-3xl opacity-10">⠿</div>
                                    <div className="empty-state-title !text-xs opacity-50">lugnt på puls</div>
                                </div>
                            ) : (
                                latestHelp.map((post: any) => (
                                    <Link key={post.id} href={`/spaces/${post.spaceId}/help/${post.id}`} className="card card-hover card-compact min-h-[80px] flex flex-col justify-between !p-4">
                                        <div className="font-bold text-bright line-clamp-1 mb-2">{post.title}</div>
                                        <div className="row-between mt-auto pt-2 border-t border-subtle/20">
                                            <span className="text-[9px] text-primary font-mono lowercase">#{post.space.name}</span>
                                            <span className="text-[9px] text-muted">av {post.user.name.split(" ")[0]}</span>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* THINGS TO MONITOR */}
            <section>
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-10 h-10 rounded-full bg-secondary/5 flex items-center justify-center text-secondary/40 border border-secondary/10">
                        <Building2 size={18} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-light text-bright lowercase tracking-tight">kontextuell medvetenhet</h2>
                        <p className="text-[9px] text-muted uppercase tracking-[0.3em] font-black opacity-40">things to monitor</p>
                    </div>
                    <span className="h-[1px] flex-1 bg-gradient-to-r from-secondary/10 via-secondary/5 to-transparent ml-6" />
                </div>

                <div className="grid-2 gap-10">
                    <div className="space-y-6">
                        <h3 className="section-title px-1">senaste insikter</h3>
                        <div className="stack gap-3">
                            {latestFeed.length === 0 ? (
                                <div className="empty-state !py-12 bg-white/[0.01] border border-dashed border-subtle/30 rounded-xl">
                                    <div className="empty-state-icon !text-3xl opacity-20">░</div>
                                    <div className="empty-state-title !text-sm">inga insikter</div>
                                    <div className="empty-state-text !text-[10px]">det har inte postats några nya insikter i flödet på ett tag.</div>
                                </div>
                            ) : (
                                latestFeed.map((post: any) => (
                                    <Link key={post.id} href={`/feed/${post.id}`} className="card card-hover group !p-5 min-h-[100px] flex flex-col justify-between">
                                        <div className="text-[14px] text-secondary group-hover:text-bright transition-colors line-clamp-2 leading-relaxed italic">{post.content}</div>
                                        <div className="row-between mt-6 pt-3 border-t border-subtle/20">
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                                                    {post.user.name.charAt(0)}
                                                </div>
                                                <span className="text-[10px] font-bold text-primary/80 uppercase tracking-wider">{post.user.name.toLowerCase()}</span>
                                            </div>
                                            <span className="text-[10px] text-muted font-mono">{formatDistanceToNow(new Date(post.createdAt), { locale: sv })}</span>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-muted/50 px-1">operativ status</h3>
                        <div className="card !p-6 bg-gradient-to-br from-tertiary/20 to-transparent border-subtle/30 shadow-glass">
                            <div className="space-y-5">
                                <div className="flex flex-wrap gap-3">
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/5 border border-success/10 shadow-glow-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                                        <span className="text-[10px] text-success font-black uppercase tracking-widest">systemet operativt</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10">
                                        <span className="text-[10px] text-primary/60 font-black uppercase tracking-widest">närvaro aktiv</span>
                                    </div>
                                </div>
                                <div className="text-[13px] text-secondary leading-relaxed italic font-serif opacity-80">
                                    "samarbete är inte bara att arbeta tillsammans, det är att tänka tillsammans."
                                </div>
                                <div className="pt-4 border-t border-subtle/10 flex items-center justify-between">
                                    <div className="flex -space-x-2 opacity-50">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-5 h-5 rounded-full border border-bg-primary bg-tertiary flex items-center justify-center text-[7px] font-bold text-muted">
                                                U{i}
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-[9px] text-muted uppercase tracking-[0.2em] font-black opacity-30">aktiva noder {">"} {onlineUsers.length + 1}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
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
            <h2 className="section-title mb-8">pågående samarbeten</h2>
            <div className="grid-2 gap-10">
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
                            <Link key={t.id} href={`/dm/${t.id}`} className="card card-hover p-6 group">
                                <div className="row-between mb-3 pb-2 border-b border-subtle/10">
                                    <span className="font-medium text-bright lowercase tracking-tight group-hover:text-primary transition-colors">{name}</span>
                                    <span className="text-[10px] text-muted opacity-40 uppercase tracking-tighter">{formatDistanceToNow(new Date(t.createdAt), { locale: sv })}</span>
                                </div>
                                <div className="text-sm text-secondary line-clamp-2 min-h-[3em] leading-relaxed italic opacity-80">
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
        <div className="space-y-24">
            <div className="section">
                <h2 className="section-title mb-8">hjälp-puls</h2>
                <div className="grid-2 gap-10">
                    {helpPosts.map((post: any) => (
                        <Link key={post.id} href={`/spaces/${post.spaceId}/help/${post.id}`} className="card card-hover p-6 group">
                            <div className="text-[9px] text-primary/40 font-black uppercase tracking-[0.2em] mb-3">#{post.space.name}</div>
                            <div className="font-medium text-lg text-bright mb-4 leading-tight group-hover:text-primary transition-colors">{post.title}</div>
                            <div className="text-[11px] text-secondary mt-auto italic opacity-70">
                                postad av <span className="font-bold">{post.user.name.toLowerCase()}</span> • {formatDistanceToNow(new Date(post.createdAt), { locale: sv })}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="section">
                <h2 className="section-title mb-8">insikter & händelser</h2>
                <div className="stack gap-4">
                    {feedPosts.map((post: any) => (
                        <Link key={post.id} href={`/feed/${post.id}`} className="card card-hover !p-5 group">
                            <div className="text-[14px] text-bright group-hover:text-primary transition-colors mb-3 leading-relaxed italic opacity-90">{post.content}</div>
                            <div className="row-between pt-3 border-t border-subtle/10">
                                <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">{post.user.name.toLowerCase()}</span>
                                <span className="text-[10px] text-muted opacity-40">{formatDistanceToNow(new Date(post.createdAt), { locale: sv })}</span>
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
            <h2 className="section-title mb-8">dina kontor</h2>
            <div className="grid-2 gap-10">
                {memberships.map(({ space }: any) => (
                    <Link key={space.id} href={`/spaces/${space.id}`} className="card card-hover p-6 group">
                        <div className="row-between mb-8 pb-3 border-b border-subtle/10">
                            <h3 className="font-medium text-lg text-bright tracking-tight group-hover:text-primary transition-colors">
                                <span className="text-primary opacity-30 mr-1">#</span>{space.name.toLowerCase()}
                            </h3>
                            <div className="text-[10px] text-muted font-black opacity-30 tracking-widest">{space._count.members} noder</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-[9px] text-muted uppercase tracking-[0.2em] font-black">
                            <div className="bg-tertiary/20 p-3 rounded-lg border border-subtle/5">
                                <div className="text-secondary mb-1 text-sm font-medium">{space._count.channels}</div>
                                kanaler
                            </div>
                            <div className="bg-tertiary/20 p-3 rounded-lg border border-subtle/5">
                                <div className="text-secondary mb-1 text-sm font-medium">{space._count.tasks || 0}</div>
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
        <div className="space-y-24 animate-in fade-in duration-500">
            <div className="section">
                <Skeleton className="w-48 h-5 mb-10 opacity-10" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <CardSkeleton className="min-h-[140px] opacity-20" />
                    <CardSkeleton className="min-h-[140px] opacity-20" />
                </div>
            </div>
            {view === "dashboard" && (
                <div className="section">
                    <Skeleton className="w-48 h-5 mb-10 opacity-10" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <CardSkeleton className="min-h-[120px] opacity-20" />
                        <CardSkeleton className="min-h-[120px] opacity-20" />
                    </div>
                </div>
            )}
        </div>
    );
}
