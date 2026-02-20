import { requireSpaceMember } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import PostDetail from "./post-detail";

interface Props {
    params: Promise<{ id: string; postId: string }>;
}

export default async function PostDetailPage({ params }: Props) {
    const { id, postId } = await params;
    const user = await requireSpaceMember(id);

    const post = await prisma.post.findUnique({
        where: { id: postId, spaceId: id },
        include: {
            user: { select: { id: true, name: true } },
            answers: {
                orderBy: { createdAt: "asc" },
                include: { user: { select: { id: true, name: true } } },
            },
        },
    });

    if (!post) return notFound();

    return (
        <>
            <div className="topbar">
                <div className="topbar-title">
                    <span className="text-muted">help /</span>{" "}
                    <span className="topbar-title-highlight">{post.title}</span>
                </div>
            </div>
            <PostDetail
                spaceId={id}
                post={{
                    id: post.id,
                    title: post.title,
                    content: post.content,
                    tags: post.tags,
                    solved: post.solved,
                    userId: post.userId,
                    userName: post.user.name,
                    createdAt: post.createdAt.toISOString(),
                    answers: post.answers.map((a: typeof post.answers[number]) => ({
                        id: a.id,
                        content: a.content,
                        accepted: a.accepted,
                        createdAt: a.createdAt.toISOString(),
                        user: a.user,
                    })),
                }}
                currentUserId={user.id}
            />
        </>
    );
}
