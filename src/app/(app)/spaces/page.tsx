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
    Layout,
    Building2
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
        <div className="max-w-[1400px] mx-auto px-12 pb-32">
            {/* 🏗️ HEADER CONTAINER (STRICT BLUEPRINT LOCK) */}
            <div className="mb-48 p-1 rounded-[3rem] border border-white/[0.04] bg-white/[0.008] backdrop-blur-3xl shadow-2xl overflow-hidden">
                <div className="bg-black/20 rounded-[2.8rem] p-10 flex flex-col gap-10">
                    <header className="animate-in fade-in slide-in-from-left-4 duration-1000">
                        <div className="flex items-center gap-4 mb-6 opacity-30">
                            <span className="text-[10px] uppercase tracking-[0.8em] font-black text-muted">operativt:navet</span>
                        </div>
                        <h1 className="text-4xl font-bold text-bright lowercase tracking-tighter leading-tight">
                            välkommen, <span className="text-primary/80">{user.name.split(" ")[0].toLowerCase()}</span>.
                        </h1>
                    </header>

                    {/* TAB NAVIGATION (STACKED AS PER BLUEPRINT) */}
                    <nav className="relative z-50 tabs tabs-subtle flex flex-wrap items-center gap-4 p-1 rounded-full border border-white/[0.02] bg-white/[0.01] w-fit">
                        <Link href="?view=dashboard" className={`tab-pill ${view === "dashboard" ? "active" : ""}`}>
                            överblick
                        </Link>
                        <Link href="?view=collaborations" className={`tab-pill ${view === "collaborations" ? "active" : ""}`}>
                            samarbeten
                        </Link>
                        <Link href="?view=pulse" className={`tab-pill ${view === "pulse" ? "active" : ""}`}>
                            puls
                        </Link>
                        <Link href="?view=offices" className={`tab-pill ${view === "offices" ? "active" : ""}`}>
                            kontor
                        </Link>
                    </nav>
                </div>
            </div>

            {/* 🧱 2-ZONE ARCHITECTURE (STRICT 8-4 BLUEPRINT) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-32 items-start">
                {/* ⬅️ LEFT COLUMN: PRIMARY CONTENT FLOW (8/12) */}
                <main className="lg:col-span-8">
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

                {/* ➡️ RIGHT COLUMN: SYSTEM ZONE (4/12 - COMPONENT LOCKED) */}
                <aside className="lg:col-span-4 space-y-32 order-last lg:order-none lg:sticky lg:top-8 animate-in fade-in slide-in-from-right-4 duration-1000 delay-300">
                    {/* PANEL 1: NÄRVARO */}
                    <section className="p-1 rounded-[2.5rem] border border-white/[0.04] bg-white/[0.008] backdrop-blur-3xl shadow-2xl overflow-hidden">
                        <div className="bg-black/20 rounded-[2.3rem] overflow-hidden">
                            <div className="p-8 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Users className="w-3 h-3 text-muted" />
                                    <h3 className="text-[10px] uppercase tracking-[0.6em] font-black text-muted">närvaro</h3>
                                </div>
                                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                            </div>
                            <div className="p-8 space-y-6">
                                {onlineUsers.length === 0 ? (
                                    <div className="text-[10px] text-muted font-mono italic opacity-20 py-4 px-2 text-center">inga andra aktiva noder.</div>
                                ) : (
                                    <div className="space-y-4">
                                        {onlineUsers.map(u => (
                                            <div key={u.id} className="flex items-center gap-4 group">
                                                <div className="relative">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-success/40" />
                                                </div>
                                                <span className="text-[10px] text-muted group-hover:text-bright transition-colors uppercase tracking-[0.3em] font-medium">{u.name.toLowerCase()}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* PANEL 2: SYSTEMSTATUS (NEW) */}
                    <section className="p-1 rounded-[2.5rem] border border-white/[0.04] bg-white/[0.008] backdrop-blur-3xl shadow-xl overflow-hidden">
                        <div className="bg-black/20 rounded-[2.3rem] overflow-hidden">
                            <div className="p-8 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Activity className="w-3 h-3 text-muted" />
                                    <h3 className="text-[10px] uppercase tracking-[0.6em] font-black text-muted">systemstatus</h3>
                                </div>
                                <span className="text-[8px] opacity-20 font-mono uppercase tracking-widest">aktiv</span>
                            </div>
                            <div className="p-8 grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="text-[16px] font-light text-secondary">99.9%</div>
                                    <div className="text-[8px] uppercase tracking-[0.2em] text-muted opacity-40">uptime</div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-[16px] font-light text-secondary">12ms</div>
                                    <div className="text-[8px] uppercase tracking-[0.2em] text-muted opacity-40">latens</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* PANEL 3: TELEMETRI */}
                    <section className="p-1 rounded-[2.5rem] border border-white/[0.04] bg-white/[0.008] backdrop-blur-3xl shadow-xl overflow-hidden">
                        <div className="bg-black/20 rounded-[2.3rem] overflow-hidden">
                            <div className="p-8 border-b border-white/[0.04] bg-white/[0.01] flex items-center gap-4">
                                <Fingerprint className="w-3 h-3 text-muted" />
                                <h3 className="text-[10px] uppercase tracking-[0.6em] font-black text-muted">telemetri</h3>
                            </div>
                            <div className="p-8 space-y-4 text-[9px] uppercase tracking-[0.4em] font-black text-muted/40 font-mono">
                                <div className="flex justify-between items-center border-b border-white/[0.02] pb-3">
                                    <span className="flex items-center gap-2"><Globe className="w-3 h-3 opacity-20" /> nätverk</span>
                                    <span className="text-success/50">kryp:v3</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/[0.02] pb-3">
                                    <span className="flex items-center gap-2"><ShieldCheck className="w-3 h-3 opacity-20" /> status</span>
                                    <span className="text-primary/40">klar</span>
                                </div>
                                <div className="flex justify-between items-center opacity-30 pt-1">
                                    <span className="flex items-center gap-2"><Cpu className="w-3 h-3 opacity-20" /> synk</span>
                                    <span>aktiv</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </aside>
            </div>
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
        <div className="space-y-48 pb-48 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* CARD 1: NUVARANDE FOKUS (PRIMARY OPERATIONAL) */}
            <section className="p-1 rounded-[3rem] border border-white/[0.04] bg-white/[0.008] backdrop-blur-3xl shadow-2xl overflow-hidden">
                <div className="bg-black/20 rounded-[2.8rem] overflow-hidden">
                    <div className="p-10 border-b border-white/[0.04] flex items-center justify-between bg-white/[0.01]">
                        <div className="flex items-center gap-4">
                            <Bell className="w-4 h-4 text-primary/60" />
                            <h2 className="text-[11px] uppercase tracking-[0.6em] font-black text-bright/90">nuvarande fokus</h2>
                        </div>
                        <span className="text-[9px] text-muted font-mono opacity-20 uppercase tracking-widest">prioriterat:fokus</span>
                    </div>

                    <div className="p-4 space-y-4">
                        {/* NOTICES SUB-SECTION */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-4 ml-6 opacity-20 pt-4">
                                <span className="text-[9px] uppercase tracking-[0.4em] font-black text-muted">notiser & omnämnanden</span>
                            </div>
                            <div className="bg-black/40 rounded-[2rem] overflow-hidden border border-white/[0.02]">
                                {mentions.length === 0 ? (
                                    <div className="py-16 text-center">
                                        <div className="text-[10px] text-muted italic opacity-10 font-serif">inga nya notiser.</div>
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
                </div>
            </section>

            {/* CARD 2: OPERATIV PULS (ACTIONABLE ITEMS) */}
            <section className="p-1 rounded-[3rem] border border-white/[0.04] bg-white/[0.008] backdrop-blur-3xl shadow-2xl overflow-hidden">
                <div className="bg-black/20 rounded-[2.8rem] overflow-hidden">
                    <div className="p-10 border-b border-white/[0.04] flex items-center justify-between bg-white/[0.01]">
                        <div className="flex items-center gap-4">
                            <HelpCircle className="w-4 h-4 text-accent-warning/60" />
                            <h2 className="text-[11px] uppercase tracking-[0.6em] font-black text-bright/90">operativ puls</h2>
                        </div>
                        <span className="text-[9px] text-muted font-mono opacity-20 uppercase tracking-widest">begäran:stöd</span>
                    </div>

                    <div className="p-4">
                        <div className="bg-black/40 rounded-[2rem] overflow-hidden border border-white/[0.02]">
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
            </section>

            {/* CARD 3: KONTEXTUELL MEDVETENHET (WATCH) */}
            <section className="p-1 rounded-[3rem] border border-white/[0.04] bg-white/[0.008] backdrop-blur-3xl shadow-xl overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                <div className="bg-black/20 rounded-[2.8rem] overflow-hidden">
                    <div className="p-10 border-b border-white/[0.04] flex items-center justify-between bg-white/[0.01]">
                        <div className="flex items-center gap-4">
                            <Activity className="w-4 h-4 text-subtle/60" />
                            <h2 className="text-[11px] uppercase tracking-[0.6em] font-black text-muted">kontextuell medvetenhet</h2>
                        </div>
                        <span className="text-[9px] text-muted font-mono opacity-20 uppercase tracking-widest">system:periferi</span>
                    </div>

                    <div className="p-4">
                        <div className="bg-black/40 rounded-[2rem] overflow-hidden border border-white/[0.02] divide-y divide-white/[0.01]">
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
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-48">
            <section className="p-1 rounded-[3rem] border border-white/[0.04] bg-white/[0.008] backdrop-blur-3xl shadow-2xl overflow-hidden">
                <div className="bg-black/20 rounded-[2.8rem] overflow-hidden">
                    <div className="p-10 border-b border-white/[0.04] flex items-center justify-between bg-white/[0.01]">
                        <div className="flex items-center gap-4">
                            <Users className="w-4 h-4 text-subtle/60" />
                            <h2 className="text-[11px] uppercase tracking-[0.6em] font-black text-bright/90">pågående samarbeten</h2>
                        </div>
                        <span className="text-[9px] text-muted font-mono opacity-20 uppercase tracking-widest">aktivitet:samarbeten</span>
                    </div>

                    <div className="p-4">
                        <div className="bg-black/40 rounded-[2rem] overflow-hidden border border-white/[0.02] divide-y divide-white/[0.02]">
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
            </section>
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
        <div className="space-y-32 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-48">
            <section className="p-1 rounded-[3rem] border border-white/[0.04] bg-white/[0.008] backdrop-blur-3xl shadow-2xl overflow-hidden">
                <div className="bg-black/20 rounded-[2.8rem] overflow-hidden">
                    <div className="p-10 border-b border-white/[0.04] flex items-center justify-between bg-white/[0.01]">
                        <div className="flex items-center gap-4">
                            <Activity className="w-4 h-4 text-accent-warning/60" />
                            <h2 className="text-[11px] uppercase tracking-[0.6em] font-black text-bright/90">hjälp-puls</h2>
                        </div>
                        <span className="text-[9px] text-muted font-mono opacity-20 uppercase tracking-widest">aktiv:hjälp</span>
                    </div>

                    <div className="p-4">
                        <div className="bg-black/40 rounded-[2rem] overflow-hidden border border-white/[0.02] divide-y divide-white/[0.02]">
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
                </div>
            </section>

            <section className="p-1 rounded-[3.5rem] border border-white/[0.02] bg-white/[0.003] opacity-80 hover:opacity-100 transition-opacity">
                <div className="bg-black/10 rounded-[3.3rem] overflow-hidden">
                    <div className="p-10 border-b border-white/[0.02] flex items-center justify-between bg-white/[0.005]">
                        <div className="flex items-center gap-4 opacity-40">
                            <Activity className="w-4 h-4" />
                            <h2 className="text-[11px] uppercase tracking-[0.6em] font-black text-muted">flöde & insikter</h2>
                        </div>
                        <span className="text-[9px] text-muted font-mono opacity-10 uppercase tracking-widest">logg:aktivitet</span>
                    </div>

                    <div className="p-4">
                        <div className="bg-black/20 rounded-[3.1rem] overflow-hidden border border-white/[0.01] divide-y divide-white/[0.01]">
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
                </div>
            </section>
        </div>
    );
}

function OfficesView({ memberships }: any) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <section className="p-1 rounded-[3rem] border border-white/[0.04] bg-white/[0.008] backdrop-blur-3xl shadow-2xl overflow-hidden">
                <div className="bg-black/20 rounded-[2.8rem] overflow-hidden">
                    <div className="p-10 border-b border-white/[0.04] flex items-center justify-between bg-white/[0.01]">
                        <div className="flex items-center gap-4">
                            <Building2 className="w-4 h-4 text-primary/60" />
                            <h2 className="text-[11px] uppercase tracking-[0.6em] font-black text-bright/90">dina kontor</h2>
                        </div>
                        <span className="text-[9px] text-muted font-mono opacity-20 uppercase tracking-widest">hub:gemenskap</span>
                    </div>

                    <div className="p-4">
                        <div className="bg-black/40 rounded-[2rem] overflow-hidden border border-white/[0.02] divide-y divide-white/[0.02]">
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
            </section>
        </div>
    );
}

function NavetSkeleton() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-32 animate-in fade-in duration-500">
            <div className="space-y-48">
                <div className="space-y-12">
                    <Skeleton className="w-64 h-8 opacity-10" />
                    <div className="space-y-8">
                        <Skeleton className="w-full h-48 rounded-[3rem] opacity-5" />
                        <Skeleton className="w-full h-48 rounded-[3rem] opacity-5" />
                    </div>
                </div>
            </div>
            <aside className="space-y-24 opacity-5">
                <Skeleton className="w-full h-64 rounded-[2.5rem]" />
                <Skeleton className="w-full h-64 rounded-[2.5rem]" />
            </aside>
        </div>
    );
}
