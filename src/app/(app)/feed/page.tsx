import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import FeedView from "@/components/feed-view";

export default async function FeedPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const posts = await prisma.feedPost.findMany({
        include: {
            user: { select: { id: true, name: true } },
            attachments: true,
            reactions: { select: { type: true, userId: true } },
            _count: { select: { comments: true } }
        },
        orderBy: { createdAt: "desc" }
    });

    // Serialize dates
    const serializedPosts = posts.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        attachments: p.attachments.map(a => ({
            ...a,
            createdAt: a.createdAt.toISOString(),
        })),
    }));

    return (
        <div className="content-area">
            <FeedView
                initialPosts={serializedPosts as any}
                currentUserId={session.user.id}
            />
        </div>
    );
}
