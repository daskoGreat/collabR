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

    return (
        <>
            <div className="topbar">
                <div className="topbar-title">
                    <span className="topbar-title-highlight">$</span> spaces
                </div>
            </div>
            <div className="content-area">
                <div className="helper-banner">
                    <strong>welcome back.</strong> pick a space to jump in. ask questions,
                    share what you&apos;re working on, or just lurk — no pressure.
                </div>

                {memberships.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">∅</div>
                        <div className="empty-state-title">no spaces yet</div>
                        <div className="empty-state-text">
                            you&apos;re not a member of any spaces. ask an admin to add you.
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
        </>
    );
}
