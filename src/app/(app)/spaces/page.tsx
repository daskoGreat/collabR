import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function SpacesPage() {
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

    const latestHelp = await prisma.post.findMany({
        where: { spaceId: { in: spaceIds }, solved: false },
        take: 3,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } }, space: { select: { name: true } } }
    });

    const latestOpps = await prisma.opportunity.findMany({
        take: 3,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } }
    });

    return (
        <>
            <div className="topbar">
                <div className="topbar-title">
                    <span className="topbar-title-highlight">$</span> community dashboard
                </div>
            </div>
            <div className="content-area">
                <div className="helper-banner mb-8">
                    <div className="text-lg mb-1"><strong>goda nyheter, {user.name.split(" ")[0].toLowerCase()}.</strong></div>
                    tillsammans bygger vi något större. här är vad som händer i dina cirklar just nu.
                </div>

                <div className="grid-2 mb-12">
                    {/* Mutual Help Pulse */}
                    <div className="section">
                        <div className="row-between mb-4">
                            <h2 className="section-title !mb-0">mutual help needed</h2>
                        </div>
                        <div className="stack">
                            {latestHelp.length === 0 ? (
                                <div className="card card-compact text-muted text-xs italic p-4 border-dashed border-subtle">
                                    no active requests. everything seems to be running smoothly.
                                </div>
                            ) : (
                                latestHelp.map(post => (
                                    <Link key={post.id} href={`/spaces/${post.spaceId}/help/${post.id}`} className="card card-hover card-compact">
                                        <div className="row-between">
                                            <span className="font-bold text-bright">{post.title}</span>
                                            <span className="text-[10px] text-muted uppercase">#{post.space.name}</span>
                                        </div>
                                        <div className="text-xs text-secondary mt-1">by {post.user.name}</div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Fresh Opportunities */}
                    <div className="section">
                        <div className="row-between mb-4">
                            <h2 className="section-title !mb-0">new opportunities</h2>
                            <Link href="/opportunities" className="text-xs text-primary hover:underline">view all</Link>
                        </div>
                        <div className="stack">
                            {latestOpps.length === 0 ? (
                                <div className="card card-compact text-muted text-xs italic p-4 border-dashed border-subtle">
                                    the board is quiet. be the first to share an opening.
                                </div>
                            ) : (
                                latestOpps.map(opp => (
                                    <Link key={opp.id} href={`/opportunities/${opp.id}`} className="card card-hover card-compact">
                                        <div className="row-between">
                                            <span className="font-bold text-bright">{opp.title}</span>
                                            <span className="badge badge-magenta badge-xs">{opp.type.toLowerCase()}</span>
                                        </div>
                                        <div className="text-xs text-secondary mt-1">{opp.user.name} shared an opening</div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="section">
                    <h2 className="section-title">your spaces</h2>
                    {memberships.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">∅</div>
                            <div className="empty-state-title">a blank canvas</div>
                            <div className="empty-state-text">
                                you haven&apos;t joined any collaboration spaces yet.
                                reaching out to an admin is a great first step.
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
                                            {space.isDefault && (
                                                <span className="badge badge-green">default</span>
                                            )}
                                        </div>
                                        {space.description && (
                                            <p className="text-secondary text-sm mb-4">
                                                {space.description}
                                            </p>
                                        )}
                                        <div className="row" style={{ gap: "var(--space-4)" }}>
                                            <span className="text-xs text-muted">
                                                {space._count.members} members
                                            </span>
                                            <span className="text-xs text-muted">
                                                {space._count.channels} channels
                                            </span>
                                            <span className="text-xs text-muted">
                                                {space._count.tasks} tasks
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
