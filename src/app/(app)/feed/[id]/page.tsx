import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import FeedPostCard from "@/components/feed-post-card";
import FeedCommentSection from "@/components/feed-comment-section";
import Link from "next/link";

export default async function FeedPostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const post = await prisma.feedPost.findUnique({
        where: { id },
        include: {
            user: { select: { id: true, name: true } },
            attachments: true,
            reactions: { select: { type: true, userId: true } },
            comments: {
                include: {
                    user: { select: { name: true } },
                    attachments: true
                },
                orderBy: { createdAt: "asc" }
            },
            _count: { select: { comments: true } }
        }
    });

    if (!post) notFound();

    // Serialize
    const serializedPost = {
        ...post,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        attachments: post.attachments.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })),
        comments: post.comments.map(c => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
            attachments: c.attachments.map(a => ({ ...a, createdAt: a.createdAt.toISOString() }))
        }))
    };

    return (
        <div className="content-area">
            <div className="max-w-2xl mx-auto py-8 px-4">
                <Link href="/feed" className="inline-flex items-center text-xs text-muted hover:text-primary mb-6 transition-colors">
                    ← tillbaka till insikter
                </Link>

                <FeedPostCard post={serializedPost as any} currentUserId={session.user.id} />

                <FeedCommentSection postId={post.id} comments={serializedPost.comments as any} />
            </div>
        </div>
    );
}
