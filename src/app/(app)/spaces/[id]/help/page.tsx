import { requireSpaceMember } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import HelpList from "./help-list";

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
                <div className="topbar-title">
                    <span className="text-muted">{space?.name.toLowerCase()} /</span>{" "}
                    <span className="topbar-title-highlight">?</span> help &amp; questions
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
            />
        </>
    );
}
