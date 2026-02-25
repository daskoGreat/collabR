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

            <div className="content-area-focused">
                <header className="mb-20 px-2 animate-in fade-in slide-in-from-top-4 duration-1000">
                    <div className="flex items-center gap-3 mb-4 opacity-50">
                        <div className="w-1 h-1 rounded-full bg-primary" />
                        <span className="text-[10px] uppercase tracking-[0.4em] font-black text-muted">terminal:navet</span>
                    </div>
                    <h1 className="text-4xl font-light text-bright lowercase tracking-tight mb-4 leading-tight">
                        välkommen, <span className="font-medium text-primary">{user.name.split(" ")[0].toLowerCase()}</span>.
                    </h1>
                    <p className="text-[14px] text-secondary max-w-xl leading-relaxed italic opacity-40 font-serif">
                        din centrala nod för konvergerande händelser och operativ medvetenhet.
                    </p>
                </header>

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
                </div>

                <div className="min-h-[600px]">
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
        <div className="space-y-[var(--space-pulse)] pb-32">
            {/* 1️⃣ PRIMARY: OPERATIONAL FOCUS (ACT) */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-6 mb-16">
                    <h2 className="text-3xl font-light text-bright lowercase tracking-tight">prioriterad uppmärksamhet</h2>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent" />
                    <span className="text-[9px] text-muted uppercase tracking-[0.4em] font-black opacity-20">operative:surface</span>
                </div>

                <div className="space-y-24 max-w-2xl">
                    <div className="space-y-10">
                        <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-muted/40 flex items-center gap-4">
                            <span className="w-2 h-[1px] bg-primary/30" />
                            händelser & omnämnanden
                        </h3>
                        <div className="stack gap-6">
                            {mentions.length === 0 ? (
                                <div className="p-16 text-center border border-dashed border-subtle/10 rounded-3xl bg-white/[0.01]">
                                    <div className="text-[11px] text-muted italic opacity-30">tabula rasa. inga aktiva händelser.</div>
                                </div>
                            ) : (
                                mentions.map((m: any) => (
                                    <Link key={m.id} href={
                                        m.message ? `/spaces/${m.message.channel.spaceId}/chat/${m.message.channelId}` :
                                            m.directMessage ? `/dm/${m.directMessage.threadId}` :
                                                m.post ? `/spaces/${m.post.spaceId}/help/${m.post.id}` : "#"
                                    } className="group relative flex flex-col gap-2 p-6 rounded-2xl transition-all hover:bg-white/[0.02]">
                                        <div className="absolute left-0 top-6 bottom-6 w-[2px] bg-primary/20 group-hover:bg-primary transition-colors" />
                                        <div className="flex items-center justify-between pl-4">
                                            <span className="text-[10px] text-primary/40 font-black uppercase tracking-[0.2em]">
                                                {m.message ? "kanal" : m.directMessage ? "privat" : "hjälp"}
                                            </span>
                                            <span className="text-[10px] text-muted font-mono opacity-30 italic">
                                                {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true, locale: sv })}
                                            </span>
                                        </div>
                                        <div className="text-[16px] text-secondary group-hover:text-bright transition-colors pl-4 leading-relaxed">
                                            {m.message && <span>omnämnande i <strong className="font-semibold text-primary/80 group-hover:text-primary">#{m.message.channel.name}</strong></span>}
                                            {m.directMessage && <span>nytt svar i din direktchatt</span>}
                                            {m.post && <span>nytt svar i <strong className="font-semibold text-primary/80 group-hover:text-primary">{m.post.title.toLowerCase()}</strong></span>}
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="space-y-10 pt-12">
                        <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-muted/40 flex items-center gap-4">
                            <span className="w-2 h-[1px] bg-accent-warning/30" />
                            behöver hjälp
                        </h3>
                        <div className="stack gap-6">
                            {latestHelp.length === 0 ? (
                                <div className="p-16 text-center border border-dashed border-subtle/10 rounded-3xl bg-white/[0.01]">
                                    <div className="text-[11px] text-muted italic opacity-30">systemet i jämvikt.</div>
                                </div>
                            ) : (
                                latestHelp.map((post: any) => (
                                    <Link key={post.id} href={`/spaces/${post.spaceId}/help/${post.id}`} className="group relative flex flex-col gap-3 p-6 rounded-2xl transition-all hover:bg-white/[0.02]">
                                        <div className="absolute left-0 top-6 bottom-6 w-[2px] bg-accent-warning/20 group-hover:bg-accent-warning transition-colors" />
                                        <div className="text-[10px] text-accent-warning/40 font-black uppercase tracking-[0.2em] pl-4">#{post.space.name}</div>
                                        <div className="text-xl font-light text-secondary group-hover:text-bright transition-colors pl-4 leading-tight">{post.title.toLowerCase()}</div>
                                        <div className="text-[10px] text-muted uppercase tracking-[0.2em] opacity-30 pl-4 italic">av {post.user.name.toLowerCase()}</div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* 2️⃣ SECONDARY: CONTEXTUAL AWARENESS (MONITOR) */}
            <section className="opacity-40 hover:opacity-100 transition-opacity duration-1000 pt-16">
                <div className="flex items-center gap-6 mb-16">
                    <h2 className="text-2xl font-light text-secondary lowercase tracking-tight">kontextuell medvetenhet</h2>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-subtle/20 via-subtle/5 to-transparent" />
                    <span className="text-[9px] text-muted uppercase tracking-[0.4em] font-black opacity-10">awareness:layer</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
                    <div className="space-y-10">
                        <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-muted/30 px-2 tracking-[0.3em]">senaste insikter</h3>
                        <div className="stack gap-4">
                            {latestFeed.length === 0 ? (
                                <div className="p-8 border border-dashed border-subtle/5 rounded-2xl">
                                    <div className="text-[10px] text-muted italic opacity-20 text-center">inga nya insikter.</div>
                                </div>
                            ) : (
                                latestFeed.map((post: any) => (
                                    <Link key={post.id} href={`/feed/${post.id}`} className="p-6 rounded-xl transition-all hover:bg-white/[0.01] group">
                                        <div className="text-[14px] text-secondary group-hover:text-bright transition-colors line-clamp-2 leading-relaxed italic mb-4 opacity-80">{post.content}</div>
                                        <div className="flex items-center justify-between opacity-30">
                                            <span className="text-[9px] font-bold text-secondary uppercase tracking-widest">{post.user.name.toLowerCase()}</span>
                                            <span className="text-[9px] text-muted font-mono">{formatDistanceToNow(new Date(post.createdAt), { locale: sv })}</span>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="space-y-10">
                        <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-muted/30 px-2 tracking-[0.3em]">operativ status</h3>
                        <div className="p-10 rounded-3xl border border-white/[0.02] bg-white/[0.005]">
                            <div className="space-y-10">
                                <div className="flex flex-col gap-6">
                                    <div className="flex items-center gap-4 opacity-40">
                                        <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                                        <span className="text-[10px] text-secondary font-black uppercase tracking-[0.2em]">systemet operativt</span>
                                    </div>
                                    <div className="flex items-center gap-4 opacity-20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        <span className="text-[10px] text-secondary font-black uppercase tracking-[0.2em]">närvaro aktiv</span>
                                    </div>
                                </div>

                                <div className="text-[16px] font-serif italic text-muted/40 leading-relaxed">
                                    "samarbete är inte bara att arbeta tillsammans, det är att tänka tillsammans."
                                </div>

                                <div className="pt-8 border-t border-subtle/5">
                                    <div className="flex items-center gap-4 opacity-10">
                                        <span className="text-[10px] text-muted uppercase tracking-[0.4em] font-black">noder online: {onlineUsers.length + 1}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3️⃣ TERTIARY: BACKGROUND INFORMATIONAL (MONITOR) */}
            <section className="opacity-20 hover:opacity-100 transition-opacity duration-1000 pt-32 border-t border-subtle/5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
                    <div className="space-y-6">
                        <h2 className="text-[10px] uppercase tracking-[0.4em] font-black text-muted/60 px-2">aktiva noder i systemet</h2>
                        <div className="p-8 rounded-2xl bg-white/[0.005] border border-white/[0.02]">
                            <div className="flex flex-wrap gap-x-8 gap-y-4">
                                {onlineUsers.length === 0 ? (
                                    <div className="text-[11px] text-muted italic opacity-30">inga andra aktiva noder.</div>
                                ) : (
                                    onlineUsers.map(u => (
                                        <div key={u.id} className="flex items-center gap-3 group">
                                            <div className="w-1 h-1 rounded-full bg-success/20 group-hover:bg-success transition-colors" />
                                            <span className="text-[11px] text-muted group-hover:text-bright transition-colors uppercase tracking-[0.2em] font-medium">{u.name.toLowerCase()}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-[10px] uppercase tracking-[0.4em] font-black text-muted/60 px-2">telemetri</h2>
                        <div className="p-8 rounded-2xl bg-white/[0.005] border border-white/[0.02]">
                            <div className="grid grid-cols-2 gap-8 text-[9px] uppercase tracking-[0.3em] font-bold text-muted/40">
                                <div className="row-between pb-3 border-b border-subtle/5">
                                    <span>förbindelse</span>
                                    <span className="text-success/40">stabil</span>
                                </div>
                                <div className="row-between pb-3 border-b border-subtle/5">
                                    <span>kryptering</span>
                                    <span className="text-primary/20 font-mono">aes-256</span>
                                </div>
                                <div className="row-between">
                                    <span>synkronisering</span>
                                    <span className="text-success/40">aktiv</span>
                                </div>
                                <div className="row-between">
                                    <span>integritet</span>
                                    <span className="text-primary/20 font-mono">verified</span>
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
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-2xl">
            <div className="flex items-center gap-6 mb-16">
                <h2 className="text-2xl font-light text-bright lowercase tracking-tight">pågående samarbeten</h2>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-subtle/20 via-subtle/5 to-transparent" />
            </div>

            <div className="stack gap-8">
                {threads.length === 0 ? (
                    <div className="py-20 text-center border border-dashed border-subtle/10 rounded-3xl bg-white/[0.01]">
                        <div className="text-[12px] text-muted italic opacity-30">inga aktiva samarbeten än. starta en konversation i en kanal eller via dm.</div>
                    </div>
                ) : (
                    threads.map((m: any) => {
                        const t = m.thread;
                        const otherMember = t.members.find((mem: any) => mem.userId !== user.id);
                        const name = t.isGroup ? (t.name || "Grupp") : (otherMember?.user.name || "Användare");
                        const lastMsg = t.messages[0];

                        return (
                            <Link key={t.id} href={`/dm/${t.id}`} className="group relative flex flex-col gap-2 p-8 rounded-2xl transition-all hover:bg-white/[0.02]">
                                <div className="absolute left-0 top-8 bottom-8 w-[2px] bg-primary/10 group-hover:bg-primary transition-colors" />
                                <div className="row-between mb-4 pb-4 border-b border-subtle/5 pl-4">
                                    <span className="font-medium text-xl text-secondary group-hover:text-bright lowercase tracking-tight transition-colors">{name}</span>
                                    <span className="text-[10px] text-muted opacity-20 uppercase tracking-tighter italic">{formatDistanceToNow(new Date(t.createdAt), { locale: sv })}</span>
                                </div>
                                <div className="text-[15px] text-muted group-hover:text-secondary line-clamp-2 min-h-[3em] leading-relaxed italic opacity-60 group-hover:opacity-100 transition-all pl-4">
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
        <div className="space-y-48 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-2xl">
            <section className="space-y-12">
                <div className="flex items-center gap-6 mb-16">
                    <h2 className="text-2xl font-light text-bright lowercase tracking-tight">hjälp-puls</h2>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-accent-warning/20 via-accent-warning/5 to-transparent" />
                </div>
                <div className="stack gap-8">
                    {helpPosts.map((post: any) => (
                        <Link key={post.id} href={`/spaces/${post.spaceId}/help/${post.id}`} className="group relative flex flex-col gap-3 p-8 rounded-2xl transition-all hover:bg-white/[0.02]">
                            <div className="absolute left-0 top-8 bottom-8 w-[2px] bg-accent-warning/20 group-hover:bg-accent-warning transition-colors" />
                            <div className="text-[10px] text-accent-warning/40 font-black uppercase tracking-[0.2em] pl-4">#{post.space.name}</div>
                            <div className="text-xl font-light text-secondary group-hover:text-bright transition-colors pl-4 leading-tight">{post.title.toLowerCase()}</div>
                            <div className="text-[11px] text-secondary mt-auto italic opacity-30 flex items-center justify-between pt-6 border-t border-subtle/5 pl-4">
                                <span>postad av <span className="font-bold">{post.user.name.toLowerCase()}</span></span>
                                <span className="text-[10px] font-mono opacity-40">{formatDistanceToNow(new Date(post.createdAt), { locale: sv })}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="opacity-40 hover:opacity-100 transition-opacity duration-1000 pt-16">
                <div className="flex items-center gap-6 mb-16">
                    <h2 className="text-2xl font-light text-secondary lowercase tracking-tight">insikter & händelser</h2>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-subtle/20 via-subtle/5 to-transparent" />
                </div>
                <div className="stack gap-6">
                    {feedPosts.map((post: any) => (
                        <Link key={post.id} href={`/feed/${post.id}`} className="p-8 rounded-2xl transition-all hover:bg-white/[0.01] group">
                            <div className="text-[15px] text-secondary group-hover:text-bright transition-all mb-6 leading-relaxed italic opacity-80">{post.content}</div>
                            <div className="flex items-center justify-between pt-6 border-t border-subtle/5 opacity-20 group-hover:opacity-40 transition-opacity">
                                <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">{post.user.name.toLowerCase()}</span>
                                <span className="text-[10px] text-muted/60">{formatDistanceToNow(new Date(post.createdAt), { locale: sv })}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}

function OfficesView({ memberships }: any) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-2xl">
            <div className="flex items-center gap-6 mb-16">
                <h2 className="text-2xl font-light text-bright lowercase tracking-tight">dina kontor</h2>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-subtle/20 via-subtle/5 to-transparent" />
            </div>
            <div className="stack gap-8">
                {memberships.map(({ space }: any) => (
                    <Link key={space.id} href={`/spaces/${space.id}`} className="group relative p-10 rounded-3xl transition-all hover:bg-white/[0.01] border border-white/[0.01] hover:border-white/[0.03]">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-light text-2xl text-secondary group-hover:text-bright tracking-tight transition-colors">
                                <span className="text-primary/40 mr-2 italic font-serif">#</span>{space.name.toLowerCase()}
                            </h3>
                            <div className="text-[9px] text-muted font-black opacity-20 tracking-[0.4em] uppercase">{space._count.members} medlemmar</div>
                        </div>
                        <div className="flex gap-12 opacity-30 group-hover:opacity-60 transition-opacity">
                            <div className="flex items-baseline gap-3">
                                <span className="text-lg font-mono text-secondary">{space._count.channels}</span>
                                <span className="text-[9px] text-muted uppercase tracking-widest font-black">kanaler</span>
                            </div>
                            <div className="flex items-baseline gap-3">
                                <span className="text-lg font-mono text-secondary">{space._count.tasks || 0}</span>
                                <span className="text-[9px] text-muted uppercase tracking-widest font-black">uppdrag</span>
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
        <div className="space-y-48 animate-in fade-in duration-500 max-w-2xl">
            <div className="space-y-12">
                <Skeleton className="w-64 h-8 mb-16 opacity-10" />
                <div className="space-y-8">
                    <Skeleton className="w-full h-32 rounded-3xl opacity-5" />
                    <Skeleton className="w-full h-32 rounded-3xl opacity-5" />
                </div>
            </div>
            {view === "dashboard" && (
                <div className="space-y-12">
                    <Skeleton className="w-64 h-6 mb-16 opacity-10" />
                    <div className="space-y-8">
                        <Skeleton className="w-full h-24 rounded-3xl opacity-5" />
                    </div>
                </div>
            )}
        </div>
    );
}
