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
        <div className="max-w-[1400px] mx-auto px-12 pb-32 animate-in fade-in duration-1000">
            {/* 🏗️ HEADER BLOCK (STRICT CONTAINMENT) */}
            <div className="navet-surface mb-48 p-12">
                <header className="mb-12">
                    <div className="navet-card-label mb-4">operativt:navet</div>
                    <h1 className="text-4xl font-black text-bright tracking-tighter">
                        välkommen, <span className="text-primary/60">{user.name.split(" ")[0].toLowerCase()}</span>.
                    </h1>
                </header>

                <nav className="navet-nav-group w-fit">
                    <Link href="?view=dashboard" className={`navet-nav-tab ${view === "dashboard" ? "active" : ""}`}>
                        överblick
                    </Link>
                    <Link href="?view=collaborations" className={`navet-nav-tab ${view === "collaborations" ? "active" : ""}`}>
                        samarbeten
                    </Link>
                    <Link href="?view=pulse" className={`navet-nav-tab ${view === "pulse" ? "active" : ""}`}>
                        puls
                    </Link>
                    <Link href="?view=offices" className={`navet-nav-tab ${view === "offices" ? "active" : ""}`}>
                        kontor
                    </Link>
                </nav>
            </div>

            {/* 🧱 2-COLUMN DASHBOARD GEOMETRY */}
            <div className="grid grid-cols-12 gap-48 items-start">
                {/* ⬅️ PRIMARY CONTENT (8/12) */}
                <main className="col-span-12 lg:col-span-8">
                    {view === "dashboard" && (
                        <DashboardView
                            user={user}
                            spaceIds={spaceIds}
                            mentions={user.mentions}
                            memberships={user.spaceMemberships}
                        />
                    )}
                    {view === "collaborations" && <CollaborationsView user={user} />}
                    {view === "pulse" && <PulseView spaceIds={spaceIds} />}
                    {view === "offices" && <OfficesView memberships={user.spaceMemberships} />}
                </main>

                {/* ➡️ SYSTEM COLUMN (4/12) */}
                <aside className="col-span-12 lg:col-span-4 space-y-48 lg:sticky lg:top-8">
                    {/* PANEL 1: NÄRVARO */}
                    <section className="navet-surface">
                        <div className="navet-header flex items-center justify-between">
                            <h3 className="navet-card-title">närvaro</h3>
                            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                        </div>
                        <div className="navet-content">
                            {onlineUsers.length === 0 ? (
                                <div className="navet-card-label opacity-10">inga noder aktiva</div>
                            ) : (
                                <div className="space-y-4">
                                    {onlineUsers.map(u => (
                                        <div key={u.id} className="flex items-center gap-4">
                                            <div className="w-1.5 h-1.5 rounded-full bg-success/20" />
                                            <span className="text-[11px] font-bold text-muted uppercase tracking-widest">{u.name.toLowerCase()}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* PANEL 2: SYSTEMSTATUS */}
                    <section className="navet-surface">
                        <div className="navet-header">
                            <h3 className="navet-card-title">systemstatus</h3>
                        </div>
                        <div className="navet-content grid grid-cols-2 gap-8">
                            <div>
                                <div className="text-2xl font-black text-bright tracking-tighter">99.9%</div>
                                <div className="navet-card-label mt-2">uptime</div>
                            </div>
                            <div>
                                <div className="text-2xl font-black text-bright tracking-tighter">12ms</div>
                                <div className="navet-card-label mt-2">latens</div>
                            </div>
                        </div>
                    </section>

                    {/* PANEL 3: TELEMETRI */}
                    <section className="navet-surface">
                        <div className="navet-header">
                            <h3 className="navet-card-title">telemetri</h3>
                        </div>
                        <div className="navet-content">
                            <div className="space-y-6">
                                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                    <span className="navet-card-label opacity-40">nätverk</span>
                                    <span className="text-[10px] font-black text-success/60 uppercase">kryp:v3</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                    <span className="navet-card-label opacity-40">status</span>
                                    <span className="text-[10px] font-black text-primary/60 uppercase">klar</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="navet-card-label opacity-40">synk</span>
                                    <span className="text-[10px] font-black text-muted uppercase">aktiv</span>
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
        <div className="space-y-64 pb-64">
            {/* CARD 1: NUVARANDE FOKUS */}
            <section className="navet-surface">
                <div className="navet-header">
                    <h2 className="navet-card-title">nuvarande fokus</h2>
                </div>
                <div className="navet-content">
                    <div className="navet-card-label mb-12">notiser & omnämnanden</div>
                    <div className="bg-white/[0.02] rounded-2xl overflow-hidden border border-white/[0.05]">
                        {mentions.length === 0 ? (
                            <div className="p-16 text-center text-[11px] text-muted italic opacity-20">inga nya notiseringar analyserade.</div>
                        ) : (
                            <div className="divide-y divide-white/[0.05]">
                                {mentions.map((m: any) => (
                                    <Link key={m.id} href={
                                        m.message ? `/spaces/${m.message.channel.spaceId}/chat/${m.message.channelId}` :
                                            m.directMessage ? `/dm/${m.directMessage.threadId}` :
                                                m.post ? `/spaces/${m.post.spaceId}/help/${m.post.id}` : "#"
                                    } className="group block p-8 transition-colors hover:bg-white/[0.02]">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[10px] font-black text-primary/40 uppercase tracking-[0.4em]">
                                                {m.message ? "kanal" : m.directMessage ? "privat" : "hjälp"}
                                            </span>
                                            <span className="text-[9px] text-muted opacity-20 uppercase tracking-tighter">
                                                {formatDistanceToNow(new Date(m.createdAt), { locale: sv })}
                                            </span>
                                        </div>
                                        <div className="text-xl font-light text-secondary group-hover:text-bright transition-colors leading-relaxed">
                                            {m.message && <span>omnämnande i <strong className="font-bold text-bright/80">#{m.message.channel.name}</strong></span>}
                                            {m.directMessage && <span>nytt svar i din direktchatt</span>}
                                            {m.post && <span>nytt svar i {m.post.title.toLowerCase()}</span>}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* CARD 2: OPERATIV PULS */}
            <section className="navet-surface">
                <div className="navet-header">
                    <h2 className="navet-card-title">operativ puls</h2>
                </div>
                <div className="navet-content">
                    <div className="navet-card-label mb-12">begäran om stöd</div>
                    <div className="bg-white/[0.02] rounded-2xl overflow-hidden border border-white/[0.05]">
                        {latestHelp.length === 0 ? (
                            <div className="p-16 text-center text-[11px] text-muted italic opacity-20">inga aktiva hjälp-förfrågningar.</div>
                        ) : (
                            <div className="divide-y divide-white/[0.05]">
                                {latestHelp.map((post: any) => (
                                    <Link key={post.id} href={`/spaces/${post.spaceId}/help/${post.id}`} className="group block p-10 transition-colors hover:bg-white/[0.02]">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-1.5 h-1.5 rounded-full bg-accent-warning" />
                                            <span className="text-[10px] font-black text-accent-warning/60 uppercase tracking-[0.4em]">#{post.space.name}</span>
                                        </div>
                                        <div className="text-2xl font-light text-secondary group-hover:text-bright transition-colors tracking-tighter leading-none mb-6">{post.title.toLowerCase()}</div>
                                        <div className="navet-card-label opacity-20 italic">postad av {post.user.name.toLowerCase()}</div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* CARD 3: KONTEXTUELL MEDVETENHET */}
            <section className="navet-surface opacity-80 hover:opacity-100 transition-opacity">
                <div className="navet-header">
                    <h2 className="navet-card-title">kontextuell medvetenhet</h2>
                </div>
                <div className="navet-content">
                    <div className="navet-card-label mb-12">flöde & insikter</div>
                    <div className="bg-white/[0.01] rounded-2xl overflow-hidden border border-white/[0.03]">
                        {latestFeed.length === 0 ? (
                            <div className="p-16 text-center text-[11px] text-muted italic opacity-10">inga händelser loggade.</div>
                        ) : (
                            <div className="divide-y divide-white/[0.03]">
                                {latestFeed.map((post: any) => (
                                    <Link key={post.id} href={`/feed/${post.id}`} className="block p-10 transition-colors hover:bg-white/[0.01] group">
                                        <div className="text-[15px] text-secondary group-hover:text-bright leading-relaxed italic mb-4 font-serif">{post.content}</div>
                                        <div className="flex items-center justify-between opacity-20">
                                            <span className="text-[9px] font-black uppercase tracking-[0.4em]">{post.user.name.toLowerCase()}</span>
                                            <span className="text-[8px] uppercase">{formatDistanceToNow(new Date(post.createdAt), { locale: sv })}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}

async function CollaborationsView({ user }: { user: any }) {
    const collaborations = await prisma.space.findMany({
        where: { members: { some: { userId: user.id } } },
        include: { channels: true, members: { include: { user: true } } },
    });

    return (
        <div className="space-y-64 pb-64">
            <section className="navet-surface">
                <div className="navet-header">
                    <h2 className="navet-card-title">aktiva samarbeten</h2>
                </div>
                <div className="navet-content">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {collaborations.map(space => (
                            <Link key={space.id} href={`/spaces/${space.id}`} className="group block bg-white/[0.02] border border-white/[0.05] rounded-2xl p-8 hover:bg-white/[0.04] transition-colors">
                                <div className="navet-card-label mb-4 opacity-20">{space.channels.length} kanaler</div>
                                <div className="text-xl font-bold text-secondary group-hover:text-bright transition-colors mb-6">{space.name.toLowerCase()}</div>
                                <div className="flex -space-x-4">
                                    {space.members.slice(0, 5).map(m => (
                                        <div key={m.userId} title={m.user.name} className="w-6 h-6 rounded-full border border-black bg-white/10 flex items-center justify-center text-[8px] font-black uppercase">
                                            {m.user.name[0]}
                                        </div>
                                    ))}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

async function PulseView({ spaceIds }: { spaceIds: string[] }) {
    const activeHelp = await prisma.post.findMany({
        where: { spaceId: { in: spaceIds }, solved: false },
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { user: true, space: true }
    });

    return (
        <div className="space-y-64 pb-64">
            <section className="navet-surface">
                <div className="navet-header">
                    <h2 className="navet-card-title">operativ puls (hjälp-flöde)</h2>
                </div>
                <div className="navet-content">
                    <div className="space-y-8">
                        {activeHelp.map(post => (
                            <Link key={post.id} href={`/spaces/${post.spaceId}/help/${post.id}`} className="block bg-white/[0.02] border border-white/[0.05] rounded-2xl p-10 hover:bg-white/[0.04] transition-colors group">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="navet-card-label opacity-40">#{post.space.name}</span>
                                    <span className="text-[9px] text-muted opacity-10 uppercase tracking-tighter">
                                        {formatDistanceToNow(new Date(post.createdAt), { locale: sv })}
                                    </span>
                                </div>
                                <div className="text-2xl font-light text-secondary group-hover:text-bright tracking-tighter leading-none mb-4">{post.title.toLowerCase()}</div>
                                <div className="navet-card-label opacity-10">av {post.user.name.toLowerCase()}</div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

async function OfficesView({ memberships }: { memberships: any[] }) {
    return (
        <div className="space-y-64 pb-64">
            <section className="navet-surface">
                <div className="navet-header">
                    <h2 className="navet-card-title">virtuella kontor</h2>
                </div>
                <div className="navet-content">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {memberships.map((m: any) => (
                            <Link key={m.space.id} href={`/spaces/${m.space.id}`} className="group block bg-white/[0.02] border border-white/[0.05] rounded-2xl p-10 hover:bg-white/[0.04] transition-colors">
                                <div className="navet-card-label mb-4 opacity-20">autonomt kontor</div>
                                <div className="text-2xl font-black text-secondary group-hover:text-bright tracking-tighter mb-4">{m.space.name.toLowerCase()}</div>
                                <div className="text-[10px] text-muted opacity-10 font-mono uppercase tracking-[0.4em]">status:aktiv</div>
                            </Link>
                        ))}
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
