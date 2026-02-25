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
                        <div className="space-y-4 opacity-40 hover:opacity-100 transition-opacity duration-500">
                            <h2 className="text-[10px] uppercase tracking-[0.3em] font-black text-muted px-2">närvaro</h2>
                            <div className="card-minimal">
                                <div className="flex flex-wrap gap-x-6 gap-y-3">
                                    {onlineUsers.length === 0 ? (
                                        <div className="text-[11px] text-muted italic">inga aktiva noder.</div>
                                    ) : (
                                        onlineUsers.map(u => (
                                            <div key={u.id} className="flex items-center gap-2 group">
                                                <div className="w-1 h-1 rounded-full bg-success/40 group-hover:bg-success transition-colors" />
                                                <span className="text-[11px] text-secondary group-hover:text-bright transition-colors uppercase tracking-widest">{u.name.toLowerCase()}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 opacity-40 hover:opacity-100 transition-opacity duration-500">
                            <h2 className="text-[10px] uppercase tracking-[0.3em] font-black text-muted px-2">systemstatus</h2>
                            <div className="card-minimal">
                                <div className="space-y-3 text-[9px] uppercase tracking-[0.2em] font-bold">
                                    <div className="row-between">
                                        <span className="text-muted/60">anslutning</span>
                                        <span className="text-success/60">stabil</span>
                                    </div>
                                    <div className="row-between">
                                        <span className="text-muted/60">närvaro</span>
                                        <span className="text-success/60">aktiv</span>
                                    </div>
                                    <div className="row-between">
                                        <span className="text-muted/60">kryptering</span>
                                        <span className="text-primary/30 font-mono">aes-256</span>
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
        <div className="space-y-32 pb-24">
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-6 mb-12">
                    <h2 className="text-3xl font-light text-bright lowercase tracking-tight">prioriterad uppmärksamhet</h2>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent" />
                    <span className="text-[9px] text-muted uppercase tracking-[0.4em] font-black opacity-30">operative surface</span>
                </div>

                <div className="grid-2 gap-16">
                    <div className="space-y-8">
                        <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-muted/60 flex items-center gap-3">
                            <span className="w-1.5 h-[1px] bg-primary/40" />
                            händelser & omnämnanden
                        </h3>
                        <div className="stack gap-4">
                            {mentions.length === 0 ? (
                                <div className="p-12 text-center border border-dashed border-subtle/20 rounded-2xl bg-white/[0.01]">
                                    <div className="text-[11px] text-muted italic opacity-40">tabula rasa. ingen kräver din uppmärksamhet just nu.</div>
                                </div>
                            ) : (
                                mentions.map((m: any) => (
                                    <Link key={m.id} href={
                                        m.message ? `/spaces/${m.message.channel.spaceId}/chat/${m.message.channelId}` :
                                            m.directMessage ? `/dm/${m.directMessage.threadId}` :
                                                m.post ? `/spaces/${m.post.spaceId}/help/${m.post.id}` : "#"
                                    } className="card card-hover group !p-6 border-l-2 border-l-primary/30 hover:border-l-primary">
                                        <div className="row-between mb-3">
                                            <span className="text-[10px] text-primary/60 font-black uppercase tracking-widest">
                                                {m.message ? "kanalkonversation" : m.directMessage ? "privat meddelande" : "hjälp-tråd"}
                                            </span>
                                            <span className="text-[10px] text-muted font-mono opacity-50">
                                                {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true, locale: sv })}
                                            </span>
                                        </div>
                                        <div className="text-[15px] text-bright group-hover:text-primary transition-colors leading-relaxed">
                                            {m.message && <span>omnämnande i <strong className="font-semibold">#{m.message.channel.name}</strong></span>}
                                            {m.directMessage && <span>nytt svar i din direktchatt</span>}
                                            {m.post && <span>nytt svar i <strong className="font-semibold">{m.post.title}</strong></span>}
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-muted/60 flex items-center gap-3">
                            <span className="w-1.5 h-[1px] bg-accent-warning/40" />
                            hjälp behövs
                        </h3>
                        <div className="stack gap-4">
                            {latestHelp.length === 0 ? (
                                <div className="p-12 text-center border border-dashed border-subtle/20 rounded-2xl bg-white/[0.01]">
                                    <div className="text-[11px] text-muted italic opacity-40">systemet i jämvikt. inga öppna förfrågningar.</div>
                                </div>
                            ) : (
                                latestHelp.map((post: any) => (
                                    <Link key={post.id} href={`/spaces/${post.spaceId}/help/${post.id}`} className="card card-hover group !p-6 border-l-2 border-l-accent-warning/30 hover:border-l-accent-warning">
                                        <div className="text-[10px] text-accent-warning/60 font-black uppercase tracking-widest mb-3">#{post.space.name}</div>
                                        <div className="text-lg font-medium text-bright mb-4 group-hover:text-accent-warning transition-colors leading-tight">{post.title.toLowerCase()}</div>
                                        <div className="text-[10px] text-muted uppercase tracking-widest opacity-40 pt-4 border-t border-subtle/10">av {post.user.name.toLowerCase()}</div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="opacity-60 hover:opacity-100 transition-opacity duration-1000">
                <div className="flex items-center gap-6 mb-12">
                    <h2 className="text-2xl font-light text-secondary lowercase tracking-tight">kontextuell medvetenhet</h2>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-subtle/20 via-subtle/5 to-transparent" />
                    <span className="text-[9px] text-muted uppercase tracking-[0.4em] font-black opacity-30">awareness layer</span>
                </div>

                <div className="grid-2 gap-16">
                    <div className="space-y-8">
                        <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-muted/40 px-2">senaste insikter</h3>
                        <div className="stack gap-4">
                            {latestFeed.length === 0 ? (
                                <div className="p-8 text-center border border-dashed border-subtle/10 rounded-xl">
                                    <div className="text-[10px] text-muted italic opacity-30">inga nya insikter i flödet.</div>
                                </div>
                            ) : (
                                latestFeed.map((post: any) => (
                                    <Link key={post.id} href={`/feed/${post.id}`} className="card-minimal group">
                                        <div className="text-[13px] text-secondary group-hover:text-bright transition-colors line-clamp-2 leading-relaxed italic mb-4">{post.content}</div>
                                        <div className="flex items-center justify-between opacity-40">
                                            <span className="text-[9px] font-bold text-primary uppercase tracking-widest">{post.user.name.toLowerCase()}</span>
                                            <span className="text-[9px] text-muted font-mono">{formatDistanceToNow(new Date(post.createdAt), { locale: sv })}</span>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-muted/40 px-2">operativ status</h3>
                        <div className="card-minimal !bg-white/[0.01]">
                            <div className="space-y-6">
                                <div className="flex flex-wrap gap-4">
                                    <div className="flex items-center gap-2 opacity-50">
                                        <div className="w-1 h-1 rounded-full bg-success" />
                                        <span className="text-[9px] text-success font-black uppercase tracking-widest">systemet operativt</span>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-30">
                                        <span className="text-[9px] text-primary font-black uppercase tracking-widest">närvaro aktiv</span>
                                    </div>
                                </div>
                                <div className="text-[12px] text-secondary leading-relaxed italic opacity-40">
                                    "samarbete är inte bara att arbeta tillsammans, det är att tänka tillsammans."
                                </div>
                                <div className="pt-4 border-t border-subtle/5 flex items-center justify-between opacity-20">
                                    <span className="text-[9px] text-muted uppercase tracking-[0.2em] font-black">aktiva noder {">"} {onlineUsers.length + 1}</span>
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
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-6 mb-12">
                <h2 className="text-2xl font-light text-bright lowercase tracking-tight">pågående samarbeten</h2>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-subtle/20 via-subtle/5 to-transparent" />
            </div>

            <div className="grid-2 gap-12">
                {threads.length === 0 ? (
                    <div className="col-span-full py-16 text-center border border-dashed border-subtle/20 rounded-2xl bg-white/[0.01]">
                        <div className="text-[11px] text-muted italic opacity-40">inga aktiva samarbeten än. starta en konversation i en kanal eller via dm.</div>
                    </div>
                ) : (
                    threads.map((m: any) => {
                        const t = m.thread;
                        const otherMember = t.members.find((mem: any) => mem.userId !== user.id);
                        const name = t.isGroup ? (t.name || "Grupp") : (otherMember?.user.name || "Användare");
                        const lastMsg = t.messages[0];

                        return (
                            <Link key={t.id} href={`/dm/${t.id}`} className="card card-hover !p-6 group">
                                <div className="row-between mb-4 pb-3 border-b border-subtle/10">
                                    <span className="font-medium text-bright lowercase tracking-tight group-hover:text-primary transition-colors">{name}</span>
                                    <span className="text-[10px] text-muted opacity-30 uppercase tracking-tighter">{formatDistanceToNow(new Date(t.createdAt), { locale: sv })}</span>
                                </div>
                                <div className="text-[13px] text-secondary line-clamp-2 min-h-[3em] leading-relaxed italic opacity-80 group-hover:text-bright transition-colors">
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
        <div className="space-y-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <div className="flex items-center gap-6 mb-12">
                    <h2 className="text-2xl font-light text-bright lowercase tracking-tight">hjälp-puls</h2>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-accent-warning/20 via-accent-warning/5 to-transparent" />
                </div>
                <div className="grid-2 gap-12">
                    {helpPosts.map((post: any) => (
                        <Link key={post.id} href={`/spaces/${post.spaceId}/help/${post.id}`} className="card card-hover !p-6 group border-l-2 border-l-accent-warning/20">
                            <div className="text-[9px] text-accent-warning/40 font-black uppercase tracking-[0.2em] mb-4">#{post.space.name}</div>
                            <div className="font-medium text-lg text-bright mb-6 leading-tight group-hover:text-accent-warning transition-colors">{post.title.toLowerCase()}</div>
                            <div className="text-[11px] text-secondary mt-auto italic opacity-50 flex items-center justify-between pt-4 border-t border-subtle/5">
                                <span>postad av <span className="font-bold">{post.user.name.toLowerCase()}</span></span>
                                <span className="text-[10px] font-mono opacity-50">{formatDistanceToNow(new Date(post.createdAt), { locale: sv })}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="opacity-60 hover:opacity-100 transition-opacity duration-1000">
                <div className="flex items-center gap-6 mb-12">
                    <h2 className="text-2xl font-light text-secondary lowercase tracking-tight">insikter & händelser</h2>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-subtle/20 via-subtle/5 to-transparent" />
                </div>
                <div className="stack gap-6">
                    {feedPosts.map((post: any) => (
                        <Link key={post.id} href={`/feed/${post.id}`} className="card-minimal group group-hover:!bg-white/[0.01]">
                            <div className="text-[14px] text-secondary group-hover:text-bright transition-colors mb-4 leading-relaxed italic opacity-90">{post.content}</div>
                            <div className="row-between pt-4 border-t border-subtle/5 opacity-40">
                                <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">{post.user.name.toLowerCase()}</span>
                                <span className="text-[10px] text-muted/60">{formatDistanceToNow(new Date(post.createdAt), { locale: sv })}</span>
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
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-6 mb-12">
                <h2 className="text-2xl font-light text-bright lowercase tracking-tight">dina kontor</h2>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-subtle/20 via-subtle/5 to-transparent" />
            </div>
            <div className="grid-2 gap-12">
                {memberships.map(({ space }: any) => (
                    <Link key={space.id} href={`/spaces/${space.id}`} className="card card-hover !p-8 group overflow-hidden">
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="font-medium text-xl text-bright tracking-tight group-hover:text-primary transition-colors">
                                <span className="text-secondary opacity-20 mr-1 italic font-serif">#</span>{space.name.toLowerCase()}
                            </h3>
                            <div className="text-[9px] text-muted font-black opacity-30 tracking-[0.3em] uppercase">{space._count.members} noder</div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-white/[0.02] p-4 rounded-xl border border-white/[0.03] group-hover:border-primary/10 transition-colors">
                                <div className="text-secondary group-hover:text-primary mb-1 text-sm font-medium transition-colors font-mono">{space._count.channels}</div>
                                <div className="text-[9px] text-muted uppercase tracking-widest font-black opacity-40">kanaler</div>
                            </div>
                            <div className="bg-white/[0.02] p-4 rounded-xl border border-white/[0.03] group-hover:border-primary/10 transition-colors">
                                <div className="text-secondary group-hover:text-primary mb-1 text-sm font-medium transition-colors font-mono">{space._count.tasks || 0}</div>
                                <div className="text-[9px] text-muted uppercase tracking-widest font-black opacity-40">uppdrag</div>
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
