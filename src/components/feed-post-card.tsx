"use client";

import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import Link from "next/link";
import { useState } from "react";
import { toggleFeedReaction, deleteFeedPost } from "@/lib/actions/feed";
import AttachmentList from "./attachment-list";

interface FeedPost {
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; name: string };
    attachments: any[];
    reactions: { type: string; userId: string }[];
    _count: { comments: number };
}

interface Props {
    post: FeedPost;
    currentUserId: string;
}

export default function FeedPostCard({ post, currentUserId }: Props) {
    const [isDeleting, setIsDeleting] = useState(false);

    const hasReacted = (type: string) => post.reactions.some(r => r.userId === currentUserId && r.type === type);
    const reactionCount = (type: string) => post.reactions.filter(r => r.type === type).length;

    async function handleReaction(type: string) {
        await toggleFeedReaction(post.id, type);
    }

    async function handleDelete() {
        if (!confirm("är du säker på att du vill ta bort posten?")) return;
        setIsDeleting(true);
        await deleteFeedPost(post.id);
        window.location.reload();
    }

    // Helper to detect links and mentions (simple version for now)
    const renderContent = (content: string) => {
        return content.split(/(\s+)/).map((part, i) => {
            if (part.startsWith("@")) return <span key={i} className="text-primary font-bold">{part}</span>;
            if (part.startsWith("http")) return <a key={i} href={part} target="_blank" rel="noopener" className="text-primary hover:underline">{part}</a>;
            return part;
        });
    };

    return (
        <div className="card mb-4 group">
            <div className="row-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {post.user.name[0].toUpperCase()}
                    </div>
                    <div>
                        <div className="text-sm font-bold text-bright">{post.user.name.toLowerCase()}</div>
                        <div className="text-[10px] text-muted">
                            {formatDistanceToNow(new Date(post.createdAt), { locale: sv })} sedan
                        </div>
                    </div>
                </div>

                {post.user.id === currentUserId && (
                    <button
                        onClick={handleDelete}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-red-400 transition-opacity"
                        disabled={isDeleting}
                    >
                        ✕
                    </button>
                )}
            </div>

            <div className="text-sm text-secondary whitespace-pre-wrap leading-relaxed mb-4">
                {renderContent(post.content)}
            </div>

            {post.attachments.length > 0 && (
                <div className="mb-4">
                    <AttachmentList attachments={post.attachments} />
                </div>
            )}

            <div className="flex items-center gap-4 pt-4 border-t border-subtle">
                <div className="flex gap-2">
                    <button
                        onClick={() => handleReaction("LIKE")}
                        className={`reaction-btn ${hasReacted("LIKE") ? "active" : ""}`}
                    >
                        👍 <span className="text-[10px] ml-1">{reactionCount("LIKE") || ""}</span>
                    </button>
                    <button
                        onClick={() => handleReaction("ROCKET")}
                        className={`reaction-btn ${hasReacted("ROCKET") ? "active" : ""}`}
                    >
                        🚀 <span className="text-[10px] ml-1">{reactionCount("ROCKET") || ""}</span>
                    </button>
                    <button
                        onClick={() => handleReaction("CELEBRATE")}
                        className={`reaction-btn ${hasReacted("CELEBRATE") ? "active" : ""}`}
                    >
                        🎉 <span className="text-[10px] ml-1">{reactionCount("CELEBRATE") || ""}</span>
                    </button>
                </div>

                <Link href={`/feed/${post.id}`} className="text-[10px] text-muted uppercase hover:text-primary transition-colors">
                    {post._count.comments} kommentarer
                </Link>
            </div>

            <style jsx>{`
                .reaction-btn {
                    @apply px-2 py-1 rounded bg-secondary/5 text-xs hover:bg-secondary/10 transition-colors border border-transparent;
                }
                .reaction-btn.active {
                    @apply border-primary/30 bg-primary/10 text-primary;
                }
            `}</style>
        </div>
    );
}
