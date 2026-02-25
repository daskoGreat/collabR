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
            <header className="mb-48 px-8 animate-in fade-in slide-in-from-top-4 duration-1000">
                <div className="flex items-center gap-4 mb-12 opacity-30">
                    <div className="w-2 h-[1px] bg-primary/60" />
                    <span className="text-[10px] uppercase tracking-[0.8em] font-black text-muted text-glow-subtle">operativt:navet</span>
                </div>
                <h1 className="text-6xl font-extralight text-bright lowercase tracking-tighter mb-8 leading-[0.9] max-w-xl">
                    välkommen, <span className="font-normal text-primary/80">{user.name.split(" ")[0].toLowerCase()}</span>.
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
            <footer className="mt-48 pt-32 border-t border-white/[0.02] opacity-10 hover:opacity-100 transition-opacity duration-1000 px-4 pb-20">
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
        <div className="space-y-48 pb-48 max-w-2xl px-4">
            {/* 1️⃣ PRIMARY OPERATIONAL ZONE (ACT) */}
            <section className="space-y-32 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                <div className="flex items-center gap-8 mb-4">
                    <h2 className="text-3xl font-extralight text-bright/90 lowercase tracking-tighter">nuvarande fokus</h2>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent" />
                </div>

                <div className="space-y-16">
                    {/* ZONE A: URGENT / ATTENTION */}
                    <div className="space-y-12">
                        <div className="flex items-center gap-4 ml-2 opacity-20">
                            <Bell className="w-3 h-3" />
                            <h3 className="text-[10px] uppercase tracking-[0.6em] font-black text-muted">notiser & omnämnanden</h3>
                        </div>
                        <div className="p-1 rounded-[3rem] border border-white/[0.04] bg-white/[0.008] backdrop-blur-3xl shadow-2xl">
                            <div className="bg-black/20 rounded-[2.8rem] overflow-hidden">
                                {mentions.length === 0 ? (
                                    <div className="py-24 text-center">
                                        <div className="text-[11px] text-muted italic opacity-10 font-serif">systemet vilar. inga nya notiser.</div>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/[0.02]">
                                        {mentions.map((m: any) => (
                                            <Link key={m.id} href={
                                                m.message ? `/spaces/${m.message.channel.spaceId}/chat/${m.message.channelId}` :
                                                    m.directMessage ? `/dm/${m.directMessage.threadId}` :
                                                        m.post ? `/spaces/${m.post.spaceId}/help/${m.post.id}` : "#"
                                            } className="group flex flex-col gap-2 p-8 transition-all hover:bg-white/[0.015]">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary transition-all shadow-[0_0_8px_rgba(var(--primary-rgb),0.3)]" />
                                                    <span className="text-[10px] text-primary/40 font-black uppercase tracking-[0.4em] group-hover:text-primary transition-colors">
                                                        {m.message ? "kanal" : m.directMessage ? "privat" : "hjälp"}
                                                    </span>
                                                    <span className="text-[9px] text-muted font-mono opacity-10 italic ml-auto uppercase tracking-tighter">
                                                        {formatDistanceToNow(new Date(m.createdAt), { locale: sv })}
                                                    </span>
                                                </div>
                                                <div className="text-2xl font-extralight text-secondary group-hover:text-bright transition-colors pl-7 leading-relaxed tracking-tight">
                                                    {m.message && <span>omnämnande i <strong className="font-medium text-bright/80">#{m.message.channel.name}</strong></span>}
                                                    {m.directMessage && <span>nytt svar i din direktchatt</span>}
                                                    {m.post && <span>nytt svar i <strong className="font-medium text-bright/80">{m.post.title.toLowerCase()}</strong></span>}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ZONE B: SUPPORT / HELP */}
                    <div className="space-y-12">
                        <div className="flex items-center gap-4 ml-2 opacity-20">
                            <HelpCircle className="w-3 h-3" />
                            <h3 className="text-[10px] uppercase tracking-[0.6em] font-black text-muted">begäran om stöd</h3>
                        </div>
                        <div className="p-1 rounded-[3rem] border border-white/[0.04] bg-white/[0.008] backdrop-blur-3xl shadow-2xl">
                            <div className="bg-black/20 rounded-[2.8rem] overflow-hidden">
                                {latestHelp.length === 0 ? (
                                    <div className="py-24 text-center">
                                        <div className="text-[10px] text-muted italic opacity-10 uppercase tracking-widest">inga öppna förfrågningar just nu.</div>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/[0.02]">
                                        {latestHelp.map((post: any) => (
                                            <Link key={post.id} href={`/spaces/${post.spaceId}/help/${post.id}`} className="group flex flex-col gap-4 p-10 transition-all hover:bg-white/[0.015]">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-2 h-2 rounded-full bg-accent-warning/40 group-hover:bg-accent-warning transition-all shadow-[0_0_8px_rgba(var(--accent-warning-rgb),0.3)]" />
                                                    <span className="text-[10px] text-accent-warning/40 font-black uppercase tracking-[0.4em] group-hover:text-accent-warning transition-colors">#{post.space.name}</span>
                                                </div>
                                                <div className="text-3xl font-extralight text-secondary group-hover:text-bright transition-colors pl-7 leading-[1.1] tracking-tighter">{post.title.toLowerCase()}</div>
                                                <div className="text-[10px] text-muted uppercase tracking-[0.4em] opacity-10 pl-7 italic font-mono">postad av <span className="font-bold">{post.user.name.toLowerCase()}</span></div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2️⃣ SECONDARY AWARENESS ZONE (WATCH) */}
            <section className="pt-32 border-t border-white/[0.03] animate-in fade-in duration-1000 delay-300">
                <div className="flex items-center gap-8 mb-24 opacity-40">
                    <h2 className="text-3xl font-extralight text-bright/60 lowercase tracking-tighter">perifer blick</h2>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-subtle/10 via-subtle/5 to-transparent" />
                </div>

                <div className="space-y-12">
                    <div className="flex items-center gap-4 ml-6 opacity-20">
                        <Activity className="w-3 h-3" />
                        <h3 className="text-[10px] uppercase tracking-[0.6em] font-black text-muted">systemflöde & insikter</h3>
                    </div>
                    <div className="p-1 rounded-[3.5rem] border border-white/[0.02] bg-white/[0.003] opacity-40 hover:opacity-100 transition-all duration-700">
                        <div className="bg-black/10 rounded-[3.3rem] overflow-hidden divide-y divide-white/[0.01]">
                            {latestFeed.length === 0 ? (
                                <div className="py-24 text-center text-[11px] text-muted italic opacity-10 font-serif">inga nya händelser analyserade.</div>
                            ) : (
                                latestFeed.map((post: any) => (
                                    <Link key={post.id} href={`/feed/${post.id}`} className="block p-10 transition-all hover:bg-white/[0.01] group">
                                        <div className="text-[17px] text-secondary group-hover:text-bright transition-colors leading-[1.6] italic mb-6 font-serif opacity-70 group-hover:opacity-100">{post.content}</div>
                                        <div className="flex items-center justify-between opacity-20 group-hover:opacity-40 transition-opacity pl-2">
                                            <span className="text-[10px] font-black text-secondary uppercase tracking-[0.5em]">{post.user.name.toLowerCase()}</span>
                                            <span className="text-[9px] text-muted font-mono tracking-tighter uppercase">{formatDistanceToNow(new Date(post.createdAt), { locale: sv })} sedan</span>
                                        </div>
                                    </Link>
                                ))
                            )}
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
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000 max-w-2xl px-4">
            <div className="flex items-center gap-8 mb-24">
                <h2 className="text-3xl font-extralight text-bright/90 lowercase tracking-tighter">pågående samarbeten</h2>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-subtle/10 via-subtle/2 to-transparent" />
            </div>

            <div className="p-1 rounded-[3rem] border border-white/[0.04] bg-white/[0.008] backdrop-blur-3xl shadow-2xl">
                <div className="bg-black/20 rounded-[2.8rem] overflow-hidden divide-y divide-white/[0.02]">
                    {threads.length === 0 ? (
                        <div className="py-24 text-center">
                            <div className="text-[11px] text-muted italic opacity-10 uppercase tracking-widest">inga aktiva samarbeten identifierade.</div>
                        </div>
                    ) : (
                        threads.map((m: any) => {
                            const t = m.thread;
                            const otherMember = t.members.find((mem: any) => mem.userId !== user.id);
                            const name = t.isGroup ? (t.name || "Grupp") : (otherMember?.user.name || "Användare");
                            const lastMsg = t.messages[0];

                            return (
                                <Link key={t.id} href={`/dm/${t.id}`} className="group flex flex-col gap-4 p-10 transition-all hover:bg-white/[0.015]">
                                    <div className="flex items-center justify-between pb-4 border-b border-white/[0.01]">
                                        <span className="font-light text-2xl text-secondary group-hover:text-bright lowercase tracking-tight transition-colors">{name}</span>
                                        <span className="text-[9px] text-muted opacity-10 uppercase tracking-tighter italic font-mono">{formatDistanceToNow(new Date(t.createdAt), { locale: sv })} sedan</span>
                                    </div>
                                    <div className="text-[16px] text-muted group-hover:text-secondary line-clamp-2 leading-relaxed italic opacity-70 group-hover:opacity-100 transition-all font-serif pl-2">
                                        {lastMsg ? lastMsg.content : "inga meddelanden än."}
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>
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
        <div className="space-y-64 animate-in fade-in slide-in-from-bottom-6 duration-1000 max-w-2xl px-4 pb-48">
            <section className="space-y-16">
                <div className="flex items-center gap-8 mb-4">
                    <h2 className="text-3xl font-extralight text-bright/90 lowercase tracking-tighter">hjälp-puls</h2>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-accent-warning/20 via-accent-warning/5 to-transparent" />
                </div>
                <div className="p-1 rounded-[3rem] border border-white/[0.04] bg-white/[0.008] backdrop-blur-3xl shadow-2xl">
                    <div className="bg-black/20 rounded-[2.8rem] overflow-hidden divide-y divide-white/[0.02]">
                        {helpPosts.map((post: any) => (
                            <Link key={post.id} href={`/spaces/${post.spaceId}/help/${post.id}`} className="group flex flex-col gap-4 p-10 transition-all hover:bg-white/[0.015]">
                                <div className="flex items-center gap-5">
                                    <div className="w-2 h-2 rounded-full bg-accent-warning/40 group-hover:bg-accent-warning transition-all shadow-[0_0_8px_rgba(var(--accent-warning-rgb),0.3)]" />
                                    <span className="text-[10px] text-accent-warning/40 font-black uppercase tracking-[0.4em] group-hover:text-accent-warning transition-colors">#{post.space.name}</span>
                                </div>
                                <div className="text-3xl font-extralight text-secondary group-hover:text-bright transition-colors pl-7 leading-[1.1] tracking-tighter">{post.title.toLowerCase()}</div>
                                <div className="text-[11px] text-secondary italic opacity-20 flex items-center justify-between pt-8 mt-4 border-t border-white/[0.01] pl-7 font-mono">
                                    <span>postad av <span className="font-bold">{post.user.name.toLowerCase()}</span></span>
                                    <span className="text-[9px] opacity-40 uppercase tracking-tighter">{formatDistanceToNow(new Date(post.createdAt), { locale: sv })} sedan</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <section className="pt-48 border-t border-white/[0.02]">
                <div className="flex items-center gap-8 mb-24 opacity-40">
                    <h2 className="text-3xl font-extralight text-bright/60 lowercase tracking-tighter">flöde & insikter</h2>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-subtle/10 via-subtle/2 to-transparent" />
                </div>
                <div className="p-1 rounded-[3.5rem] border border-white/[0.02] bg-white/[0.003]">
                    <div className="bg-black/10 rounded-[3.3rem] overflow-hidden divide-y divide-white/[0.01]">
                        {feedPosts.map((post: any) => (
                            <Link key={post.id} href={`/feed/${post.id}`} className="block p-10 transition-all hover:bg-white/[0.01] group">
                                <div className="text-[17px] text-secondary group-hover:text-bright transition-all mb-6 leading-[1.6] italic opacity-70 group-hover:opacity-100 font-serif">{post.content}</div>
                                <div className="flex items-center justify-between opacity-20 group-hover:opacity-40 transition-opacity pl-2">
                                    <span className="text-[10px] font-black text-secondary uppercase tracking-[0.5em]">{post.user.name.toLowerCase()}</span>
                                    <span className="text-[9px] text-muted font-mono tracking-tighter uppercase">{formatDistanceToNow(new Date(post.createdAt), { locale: sv })} sedan</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

function OfficesView({ memberships }: any) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000 max-w-2xl px-4">
            <div className="flex items-center gap-8 mb-24">
                <h2 className="text-3xl font-extralight text-bright/90 lowercase tracking-tighter">dina kontor</h2>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent" />
            </div>
            <div className="p-1 rounded-[3rem] border border-white/[0.04] bg-white/[0.008] backdrop-blur-3xl shadow-2xl">
                <div className="bg-black/20 rounded-[2.8rem] overflow-hidden divide-y divide-white/[0.02]">
                    {memberships.map(({ space }: any) => (
                        <Link key={space.id} href={`/spaces/${space.id}`} className="group block p-12 transition-all hover:bg-white/[0.015]">
                            <div className="flex items-center justify-between mb-10">
                                <h3 className="font-extralight text-3xl text-secondary group-hover:text-bright tracking-tighter transition-colors">
                                    <span className="text-primary/40 mr-2 italic font-serif">#</span>{space.name.toLowerCase()}
                                </h3>
                                <div className="text-[10px] text-muted font-black opacity-10 tracking-[0.5em] uppercase">{space._count.members} medlemmar</div>
                            </div>
                            <div className="flex gap-16 opacity-30 group-hover:opacity-70 transition-opacity font-mono pl-2">
                                <div className="flex items-baseline gap-4">
                                    <span className="text-xl font-light text-secondary">{space._count.channels}</span>
                                    <span className="text-[10px] text-muted uppercase tracking-[0.3em] font-black opacity-40">kanaler</span>
                                </div>
                                <div className="flex items-baseline gap-4">
                                    <span className="text-xl font-light text-secondary">{space._count.tasks || 0}</span>
                                    <span className="text-[10px] text-muted uppercase tracking-[0.3em] font-black opacity-40">uppdrag</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
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
