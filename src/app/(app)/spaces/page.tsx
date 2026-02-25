"use strict";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Terminal,
    Activity,
    Fingerprint,
    ShieldCheck,
    Cpu,
    Globe,
    Bell,
    HelpCircle,
    Hash,
    MessageSquare,
    Users,
    Layout
} from "lucide-react";

export default async function NavetPage({ searchParams }: { searchParams: { view?: string } }) {
    const session = await auth();
    if (!session?.user) return null;
    const view = searchParams.view || "dashboard";

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            spaceMemberships: { include: { space: { include: { _count: { select: { channels: true, members: true } } } } } },
            mentions: {
                take: 5,
                orderBy: { createdAt: "desc" },
                include: {
                    message: { include: { channel: { select: { name: true, spaceId: true } } } },
                    directMessage: { select: { threadId: true } },
                    post: { select: { id: true, title: true, spaceId: true } }
                }
            }
        }
    });

    if (!user) return null;

    const spaceIds = user.spaceMemberships.map((m: any) => m.spaceId);
    const onlineUsers = await prisma.user.findMany({
        where: {
            lastSeenAt: { gte: new Date(Date.now() - 1000 * 60 * 5) },
            id: { not: user.id }
        },
        select: { id: true, name: true }
    });

    return (
        <div className="content-area-focused">
            <header className="mb-32 px-4 animate-in fade-in slide-in-from-top-4 duration-1000">
                <div className="flex items-center gap-4 mb-8 opacity-30">
                    <div className="w-1.5 h-[1px] bg-primary" />
                    <span className="text-[9px] uppercase tracking-[0.6em] font-black text-muted text-glow-subtle">terminal:navet</span>
                </div>
                <h1 className="text-5xl font-extralight text-bright lowercase tracking-tighter mb-6 leading-tight">
                    välkommen, <span className="font-normal text-primary">{user.name.split(" ")[0].toLowerCase()}</span>.
                </h1>
            </header>

            <div className="mb-24 px-4">
                <div className="tabs tabs-subtle mb-10 border-b border-white/[0.02]">
                    <Link href="?view=dashboard" className={`tab pb-4 ${view === "dashboard" ? "active" : "opacity-30"}`}>
                        överblick
                    </Link>
                    <Link href="?view=collaborations" className={`tab pb-4 ${view === "collaborations" ? "active" : "opacity-30"}`}>
                        samarbeten
                    </Link>
                    <Link href="?view=pulse" className={`tab pb-4 ${view === "pulse" ? "active" : "opacity-30"}`}>
                        puls
                    </Link>
                    <Link href="?view=offices" className={`tab pb-4 ${view === "offices" ? "active" : "opacity-30"}`}>
                        kontor
                    </Link>
                </div>
            </div>

            <main className="px-4">
                {view === "dashboard" && (
                    <DashboardView
                        user={user}
                        spaceIds={spaceIds}
                        mentions={user.mentions}
                        memberships={user.spaceMemberships}
                        onlineUsers={onlineUsers}
                    />
                )}
                {view === "collaborations" && <CollaborationsView user={user} />}
                {view === "pulse" && <PulseView spaceIds={spaceIds} />}
                {view === "offices" && <OfficesView memberships={user.spaceMemberships} />}
            </main>

            {/* 3️⃣ INTEGRATED STATUS FOOTER (TERTIARY) */}
            <footer className="mt-48 pt-32 border-t border-white/[0.02] opacity-20 hover:opacity-100 transition-opacity duration-1000 px-4 pb-20">
                <div className="flex flex-col md:flex-row gap-16 md:items-start justify-between">
                    <div className="space-y-6 flex-1">
                        <h2 className="text-[9px] uppercase tracking-[0.5em] font-black text-muted">aktiva noder i systemet</h2>
                        <div className="flex flex-wrap gap-x-12 gap-y-6">
                            {onlineUsers.length === 0 ? (
                                <span className="text-[10px] text-muted font-mono italic opacity-40">inga andra aktiva noder identifierade.</span>
                            ) : (
                                onlineUsers.map(u => (
                                    <div key={u.id} className="flex items-center gap-3 group px-4 py-2 rounded-full border border-white/[0.03] bg-white/[0.01]">
                                        <div className="relative">
                                            <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                                            <div className="absolute inset-0 animate-ping bg-success rounded-full opacity-20" />
                                        </div>
                                        <span className="text-[10px] text-muted group-hover:text-bright transition-colors uppercase tracking-[0.2em] font-medium">{u.name.toLowerCase()}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="space-y-6 max-w-xs w-full">
                        <h2 className="text-[9px] uppercase tracking-[0.5em] font-black text-muted">operativ telemetri</h2>
                        <div className="space-y-4 text-[9px] uppercase tracking-[0.3em] font-black text-muted/40 font-mono">
                            <div className="flex justify-between items-center border-b border-white/[0.02] pb-2">
                                <span className="flex items-center gap-2"><Globe className="w-3 h-3 opacity-20" /> nätverk</span>
                                <span className="text-success/50">krypterad:v3</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/[0.02] pb-2">
                                <span className="flex items-center gap-2"><ShieldCheck className="w-3 h-3 opacity-20" /> integritet</span>
                                <span className="text-primary/40 font-black">verified</span>
                            </div>
                            <div className="flex justify-between items-center opacity-30">
                                <span className="flex items-center gap-2"><Cpu className="w-3 h-3 opacity-20" /> synkronisering</span>
                                <span>realtime:active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

async function DashboardView({ user, spaceIds, mentions, memberships, onlineUsers }: any) {
    const latestHelp = await prisma.post.findMany({
        where: { spaceId: { in: spaceIds }, solved: false },
        take: 3,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } }, space: { select: { name: true } } }
    });

    const latestFeed = await prisma.feedPost.findMany({
        take: 3,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } }
    });

    return (
        <div className="space-y-[var(--space-pulse)] pb-32 max-w-2xl">
            {/* 1️⃣ PRIMARY: OPERATIVE FOCUS (ACT) */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-6 mb-20">
                    <h2 className="text-3xl font-extralight text-bright lowercase tracking-tighter">prioriterad uppmärksamhet</h2>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
                </div>

                <div className="space-y-32">
                    <div className="space-y-16">
                        <h3 className="text-[10px] uppercase tracking-[0.5em] font-black text-muted/30 ml-4">händelser & omnämnanden</h3>
                        <div className="space-y-4">
                            {mentions.length === 0 ? (
                                <div className="py-20 text-center border-y border-white/[0.01]">
                                    <div className="text-[11px] text-muted italic opacity-20 font-serif">tabula rasa. systemet vilar.</div>
                                </div>
                            ) : (
                                mentions.map((m: any) => (
                                    <Link key={m.id} href={
                                        m.message ? `/spaces/${m.message.channel.spaceId}/chat/${m.message.channelId}` :
                                            m.directMessage ? `/dm/${m.directMessage.threadId}` :
                                                m.post ? `/spaces/${m.post.spaceId}/help/${m.post.id}` : "#"
                                    } className="group flex flex-col gap-2 p-6 rounded-3xl transition-all hover:bg-white/[0.015]">
                                        <div className="flex items-center gap-4">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-all shadow-[0_0_8px_rgba(var(--primary-rgb),0.2)]" />
                                            <span className="text-[10px] text-primary/40 font-black uppercase tracking-[0.3em] group-hover:text-primary transition-colors">
                                                {m.message ? "kanal" : m.directMessage ? "privat" : "hjälp"}
                                            </span>
                                            <span className="text-[9px] text-muted font-mono opacity-20 italic ml-auto uppercase tracking-tighter">
                                                {formatDistanceToNow(new Date(m.createdAt), { locale: sv })} sedan
                                            </span>
                                        </div>
                                        <div className="text-xl font-light text-secondary group-hover:text-bright transition-colors pl-6 leading-relaxed">
                                            {m.message && <span>omnämnande i <strong className="font-medium text-bright/80">#{m.message.channel.name}</strong></span>}
                                            {m.directMessage && <span>nytt svar i din direktchatt</span>}
                                            {m.post && <span>nytt svar i <strong className="font-medium text-bright/80">{m.post.title.toLowerCase()}</strong></span>}
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="space-y-16">
                        <h3 className="text-[10px] uppercase tracking-[0.5em] font-black text-muted/30 ml-4">hjälp sökes</h3>
                        <div className="space-y-4">
                            {latestHelp.length === 0 ? (
                                <div className="py-12 border-y border-white/[0.01] text-center">
                                    <div className="text-[10px] text-muted italic opacity-20">inga öppna förfrågningar.</div>
                                </div>
                            ) : (
                                latestHelp.map((post: any) => (
                                    <Link key={post.id} href={`/spaces/${post.spaceId}/help/${post.id}`} className="group flex flex-col gap-3 p-8 rounded-3xl transition-all hover:bg-white/[0.015]">
                                        <div className="flex items-center gap-4">
                                            <div className="w-1.5 h-1.5 rounded-full bg-accent-warning/40 group-hover:bg-accent-warning transition-all shadow-[0_0_8px_rgba(var(--accent-warning-rgb),0.2)]" />
                                            <span className="text-[10px] text-accent-warning/40 font-black uppercase tracking-[0.3em] group-hover:text-accent-warning transition-colors">#{post.space.name}</span>
                                        </div>
                                        <div className="text-2xl font-extralight text-secondary group-hover:text-bright transition-colors pl-6 leading-tight tracking-tight">{post.title.toLowerCase()}</div>
                                        <div className="text-[10px] text-muted uppercase tracking-[0.3em] opacity-20 pl-6 italic">postad av <span className="font-bold">{post.user.name.toLowerCase()}</span></div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* 2️⃣ SECONDARY: MONITORING LAYER (AWARE) */}
            <section className="opacity-30 hover:opacity-100 transition-opacity duration-1000">
                <div className="flex items-center gap-6 mb-16">
                    <h2 className="text-2xl font-extralight text-secondary lowercase tracking-tight">kontextuell medvetenhet</h2>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-subtle/5 via-subtle/2 to-transparent" />
                </div>

                <div className="space-y-16">
                    <h3 className="text-[10px] uppercase tracking-[0.5em] font-black text-muted/20 ml-4">insikter & händelser</h3>
                    <div className="space-y-6">
                        {latestFeed.length === 0 ? (
                            <div className="text-[11px] text-muted italic opacity-20 ml-6">inga nya insikter i flödet.</div>
                        ) : (
                            latestFeed.map((post: any) => (
                                <Link key={post.id} href={`/feed/${post.id}`} className="block p-8 rounded-3xl transition-all hover:bg-white/[0.01] group">
                                    <div className="text-[15px] text-secondary group-hover:text-bright transition-colors leading-relaxed italic mb-4 font-serif opacity-80">{post.content}</div>
                                    <div className="flex items-center justify-between opacity-20 pl-2">
                                        <span className="text-[9px] font-black text-secondary uppercase tracking-[0.4em]">{post.user.name.toLowerCase()}</span>
                                        <span className="text-[9px] text-muted font-mono">{formatDistanceToNow(new Date(post.createdAt), { locale: sv })}</span>
                                    </div>
                                </Link>
                            ))
                        )}
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
            <div className="flex items-center gap-6 mb-20">
                <h2 className="text-3xl font-extralight text-bright lowercase tracking-tighter">pågående samarbeten</h2>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-subtle/5 via-subtle/2 to-transparent" />
            </div>

            <div className="stack gap-8">
                {threads.length === 0 ? (
                    <div className="py-20 text-center border-y border-white/[0.01]">
                        <div className="text-[12px] text-muted italic opacity-30">inga aktiva samarbeten än. starta en konversation i en kanal eller via dm.</div>
                    </div>
                ) : (
                    threads.map((m: any) => {
                        const t = m.thread;
                        const otherMember = t.members.find((mem: any) => mem.userId !== user.id);
                        const name = t.isGroup ? (t.name || "Grupp") : (otherMember?.user.name || "Användare");
                        const lastMsg = t.messages[0];

                        return (
                            <Link key={t.id} href={`/dm/${t.id}`} className="group flex flex-col gap-4 p-8 rounded-3xl transition-all hover:bg-white/[0.015]">
                                <div className="flex items-center justify-between pb-4 border-b border-white/[0.02]">
                                    <span className="font-light text-2xl text-secondary group-hover:text-bright lowercase tracking-tight transition-colors">{name}</span>
                                    <span className="text-[9px] text-muted opacity-20 uppercase tracking-tighter italic font-mono">{formatDistanceToNow(new Date(t.createdAt), { locale: sv })}</span>
                                </div>
                                <div className="text-[15px] text-muted group-hover:text-secondary line-clamp-2 leading-relaxed italic opacity-60 group-hover:opacity-100 transition-all font-serif">
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
        <div className="space-y-[var(--space-pulse)] animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-2xl">
            <section className="space-y-16">
                <div className="flex items-center gap-6 mb-20">
                    <h2 className="text-3xl font-extralight text-bright lowercase tracking-tighter">hjälp-puls</h2>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-accent-warning/10 via-accent-warning/5 to-transparent" />
                </div>
                <div className="space-y-8">
                    {helpPosts.map((post: any) => (
                        <Link key={post.id} href={`/spaces/${post.spaceId}/help/${post.id}`} className="group flex flex-col gap-3 p-8 rounded-3xl transition-all hover:bg-white/[0.015]">
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent-warning/40 group-hover:bg-accent-warning transition-all shadow-[0_0_8px_rgba(var(--accent-warning-rgb),0.2)]" />
                                <span className="text-[10px] text-accent-warning/40 font-black uppercase tracking-[0.3em] group-hover:text-accent-warning transition-colors">#{post.space.name}</span>
                            </div>
                            <div className="text-2xl font-extralight text-secondary group-hover:text-bright transition-colors pl-6 leading-tight tracking-tight">{post.title.toLowerCase()}</div>
                            <div className="text-[11px] text-secondary italic opacity-20 flex items-center justify-between pt-6 border-t border-white/[0.01] pl-6">
                                <span>postad av <span className="font-bold">{post.user.name.toLowerCase()}</span></span>
                                <span className="text-[9px] font-mono opacity-40">{formatDistanceToNow(new Date(post.createdAt), { locale: sv })}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="opacity-30 hover:opacity-100 transition-opacity duration-1000 pt-32 border-t border-white/[0.02]">
                <div className="flex items-center gap-6 mb-16">
                    <h2 className="text-2xl font-extralight text-secondary lowercase tracking-tight">insikter & händelser</h2>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-subtle/5 via-subtle/2 to-transparent" />
                </div>
                <div className="space-y-6">
                    {feedPosts.map((post: any) => (
                        <Link key={post.id} href={`/feed/${post.id}`} className="block p-8 rounded-3xl transition-all hover:bg-white/[0.01] group">
                            <div className="text-[15px] text-secondary group-hover:text-bright transition-all mb-4 leading-relaxed italic opacity-80 font-serif">{post.content}</div>
                            <div className="flex items-center justify-between opacity-20 group-hover:opacity-40 transition-opacity pl-2">
                                <span className="text-[9px] font-black text-secondary uppercase tracking-[0.4em]">{post.user.name.toLowerCase()}</span>
                                <span className="text-[9px] text-muted font-mono">{formatDistanceToNow(new Date(post.createdAt), { locale: sv })}</span>
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
            <div className="flex items-center gap-6 mb-20">
                <h2 className="text-3xl font-extralight text-bright lowercase tracking-tighter">dina kontor</h2>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
            </div>
            <div className="space-y-8">
                {memberships.map(({ space }: any) => (
                    <Link key={space.id} href={`/spaces/${space.id}`} className="group p-10 rounded-3xl transition-all hover:bg-white/[0.015] border border-white/[0.01] hover:border-white/[0.03]">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-extralight text-2xl text-secondary group-hover:text-bright tracking-tighter transition-colors">
                                <span className="text-primary/40 mr-2 italic font-serif">#</span>{space.name.toLowerCase()}
                            </h3>
                            <div className="text-[9px] text-muted font-black opacity-20 tracking-[0.4em] uppercase">{space._count.members} medlemmar</div>
                        </div>
                        <div className="flex gap-12 opacity-30 group-hover:opacity-60 transition-opacity font-mono">
                            <div className="flex items-baseline gap-3">
                                <span className="text-lg font-light text-secondary">{space._count.channels}</span>
                                <span className="text-[9px] text-muted uppercase tracking-widest font-black">kanaler</span>
                            </div>
                            <div className="flex items-baseline gap-3">
                                <span className="text-lg font-light text-secondary">{space._count.tasks || 0}</span>
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
