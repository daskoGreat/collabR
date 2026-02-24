import { requireSpaceMember } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import HelpList from "./help-list";
import BackButton from "@/components/back-button";
import Link from "next/link";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function HelpPage({ params }: Props) {
    const { id } = await params;
    const user = await requireSpaceMember(id);

    const space = await prisma.space.findUnique({
        where: { id },
        select: { name: true },
    });

    const posts = await prisma.post.findMany({
        where: { spaceId: id },
        orderBy: { createdAt: "desc" },
        include: {
            user: { select: { id: true, name: true } },
            _count: { select: { answers: true } },
        },
    });

    return (
        <>
            <div className="topbar">
                <div className="row" style={{ gap: "var(--space-4)" }}>
                    <BackButton />
                    <div className="topbar-title">
                        <Link href="/spaces" className="text-muted hover:text-primary transition-colors">navet</Link>
                        <span className="text-muted mx-2">/</span>
                        <Link href={`/spaces/${id}`} className="text-muted hover:text-primary transition-colors">#{space?.name.toLowerCase()}</Link>
                        <span className="text-muted mx-2">/</span>
                        <span className="topbar-title-highlight">?</span> hjälp &amp; frågor
                    </div>
                </div>
            </div>
            <HelpList
                spaceId={id}
                posts={posts.map((p: typeof posts[number]) => ({
                    id: p.id,
                    title: p.title,
                    content: p.content,
                    tags: p.tags,
                    solved: p.solved,
                    user: p.user,
                    answerCount: p._count.answers,
                    createdAt: p.createdAt.toISOString(),
                }))}
                currentUserId={user.id}
                currentUserName={user.name}
            />
        </>
    );
}
