import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";

export default async function NavetPage() {
    const user = await requireAuth();

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

    // Fetch active help requests
    const latestHelp = await prisma.post.findMany({
        where: { spaceId: { in: spaceIds }, solved: false },
        take: 3,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } }, space: { select: { name: true } } }
    });

    const latestFeed = await prisma.feedPost.findMany({
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 3
    });

    // Fetch active DM threads
    const threadMemberships = await prisma.threadMember.findMany({
        where: { userId: user.id },
        include: {
            thread: {
                include: {
                    members: {
                        include: {
                            user: { select: { id: true, name: true, lastSeenAt: true } }
                        }
                    },
                    messages: {
                        take: 1,
                        orderBy: { createdAt: "desc" }
                    }
                }
            }
        },
        orderBy: { joinedAt: "desc" },
        take: 4
    });

    // Online users (threshold 5 min)
    const now = new Date();
    const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;
    const onlineUsers = await prisma.user.findMany({
        where: {
            lastSeenAt: {
                gt: new Date(now.getTime() - ONLINE_THRESHOLD_MS)
            },
            id: { not: user.id }
        },
        select: { id: true, name: true },
        take: 8
    });

    // Unread mentions
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

                <div className="grid-3 mb-12">
                    {/* Collaborative Pulse (Mentions/Presence) */}
                    <div className="section col-span-2">
                        <div className="row-between mb-4">
                            <h2 className="section-title !mb-0">senaste händelser</h2>
                        </div>
                        <div className="stack">
                            {mentions.length === 0 ? (
                                <div className="card card-compact text-muted text-xs italic p-4 border-dashed border-subtle">
                                    inga nya omnämnanden. du är helt uppdaterad.
                                </div>
                            ) : (
                                mentions.map(m => (
                                    <div key={m.id} className="card card-compact border-l-2 border-l-primary/50">
                                        <div className="text-xs text-muted mb-1">
                                            {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true, locale: sv })}
                                        </div>
                                        <div className="text-sm">
                                            {m.message && (
                                                <Link href={`/spaces/${m.message.channel.spaceId}/chat/${m.message.channelId}`} className="hover:underline">
                                                    omnämnande i <strong>#{m.message.channel.name}</strong>
                                                </Link>
                                            )}
                                            {m.directMessage && (
                                                <Link href={`/dm/${m.directMessage.threadId}`} className="hover:underline">
                                                    nytt meddelande i en direktchatt
                                                </Link>
                                            )}
                                            {m.post && (
                                                <Link href={`/spaces/${m.post.spaceId}/help/${m.post.id}`} className="hover:underline">
                                                    omnämnande i hjälptråden <strong>{m.post.title}</strong>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Who's here right now */}
                    <div className="section">
                        <h2 className="section-title">vilka är här?</h2>
                        <div className="card card-compact bg-primary/5 border-primary/20">
                            <div className="flex flex-wrap gap-3">
                                {onlineUsers.length === 0 ? (
                                    <div className="text-xs text-muted italic">just nu är det bara du här.</div>
                                ) : (
                                    onlineUsers.map(u => (
                                        <div key={u.id} className="flex items-center gap-2 group">
                                            <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_5px_var(--success)]" />
                                            <span className="text-xs font-medium group-hover:text-bright">{u.name.toLowerCase()}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                            {onlineUsers.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-subtle text-[10px] text-muted uppercase tracking-wider">
                                    {onlineUsers.length} kollegor aktiva
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid-2 mb-12">
                    {/* Active Chats/Collaborations */}
                    <div className="section">
                        <h2 className="section-title">pågående samarbeten</h2>
                        <div className="stack">
                            {threadMemberships.length === 0 ? (
                                <div className="p-4 border-dashed border-subtle rounded text-center text-xs text-muted">
                                    inga aktiva chattar än.
                                </div>
                            ) : (
                                threadMemberships.map(m => {
                                    const t = (m as any).thread;
                                    const otherMember = t.members.find((mem: any) => mem.userId !== user.id);
                                    const name = t.isGroup ? (t.name || "Grupp") : (otherMember?.user.name || "Användare");
                                    const lastMsg = t.messages[0];

                                    return (
                                        <Link key={t.id} href={`/dm/${t.id}`} className="card card-hover card-compact">
                                            <div className="row-between">
                                                <span className="font-bold text-bright">{name.toLowerCase()}</span>
                                                <span className="text-[10px] text-muted uppercase">
                                                    {formatDistanceToNow(new Date(t.createdAt), { locale: sv })} sedan
                                                </span>
                                            </div>
                                            {lastMsg && (
                                                <div className="text-xs text-secondary mt-1 truncate">
                                                    {lastMsg.content}
                                                </div>
                                            )}
                                        </Link>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Latest Feed Insights */}
                    <div className="section">
                        <h2 className="section-title">senaste insikter</h2>
                        <div className="stack">
                            {latestFeed.length === 0 ? (
                                <div className="card card-compact text-muted text-xs italic p-4 border-dashed border-subtle">
                                    inga insikter delade än.
                                </div>
                            ) : (
                                latestFeed.map(post => (
                                    <Link key={post.id} href={`/feed/${post.id}`} className="card card-hover card-compact">
                                        <div className="row-between">
                                            <span className="font-bold text-bright">{post.user.name.toLowerCase()}</span>
                                            <span className="text-[10px] text-muted uppercase">
                                                {formatDistanceToNow(new Date(post.createdAt), { locale: sv })}
                                            </span>
                                        </div>
                                        <div className="text-xs text-secondary mt-1 truncate">
                                            {post.content}
                                        </div>
                                    </Link>
                                ))
                            )}
                            <Link href="/feed" className="text-[10px] text-primary hover:underline uppercase font-bold text-right pr-2">
                                visa alla →
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="grid-2 mb-12">
                    {/* Help Needed */}
                    <div className="section">
                        <h2 className="section-title">puls: hjälp behövs</h2>
                        <div className="stack">
                            {latestHelp.length === 0 ? (
                                <div className="card card-compact text-muted text-xs italic p-4 border-dashed border-subtle">
                                    inga aktiva förfrågningar just nu.
                                </div>
                            ) : (
                                latestHelp.map(post => (
                                    <Link key={post.id} href={`/spaces/${post.spaceId}/help/${post.id}`} className="card card-hover card-compact">
                                        <div className="row-between">
                                            <span className="font-bold text-bright">{post.title}</span>
                                            <span className="text-[10px] text-muted uppercase">#{post.space.name}</span>
                                        </div>
                                        <div className="text-xs text-secondary mt-1">av {post.user.name}</div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Your Spaces (Move here to balance GRID) */}
                    <div className="section">
                        <h2 className="section-title">dina kontor</h2>
                        <div className="grid grid-cols-2 gap-2">
                            {memberships.map(sm => (
                                <Link key={sm.space.id} href={`/spaces/${sm.space.id}`} className="card card-hover card-compact border-subtle">
                                    <div className="font-bold text-bright truncate">{sm.space.name}</div>
                                    <div className="text-[10px] text-muted uppercase mt-1">
                                        {sm.space._count.members} medlemmar • {sm.space._count.channels} kanaler
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="section">
                    <h2 className="section-title">dina arbetsytor</h2>
                    {memberships.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">∅</div>
                            <div className="empty-state-title">en tom rymd</div>
                            <div className="empty-state-text">
                                du har inte gått med i några samarbetsytor än.
                            </div>
                        </div>
                    ) : (
                        <div className="grid-2">
                            {memberships.map(({ space }) => (
                                <Link
                                    key={space.id}
                                    href={`/spaces/${space.id}`}
                                    style={{ textDecoration: "none" }}
                                >
                                    <div className="card card-hover">
                                        <div className="row-between mb-2">
                                            <h3 style={{ fontSize: "var(--font-size-md)", fontWeight: 700 }}>
                                                <span className="text-neon">#</span> {space.name.toLowerCase()}
                                            </h3>
                                        </div>
                                        <div className="row" style={{ gap: "var(--space-4)" }}>
                                            <span className="text-xs text-muted">
                                                {space._count.members} medlemmar
                                            </span>
                                            <span className="text-xs text-muted">
                                                {space._count.channels} kanaler
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
