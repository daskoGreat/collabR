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
        <div className="feed-card group">
            <div className="feed-header">
                <div className="feed-avatar">
                    {post.user.name[0].toUpperCase()}
                </div>
                <div className="feed-meta">
                    <div className="feed-author">{post.user.name.toLowerCase()}</div>
                    <div className="feed-time">
                        {formatDistanceToNow(new Date(post.createdAt), { locale: sv })} sedan
                    </div>
                </div>

                {post.user.id === currentUserId && (
                    <button
                        onClick={handleDelete}
                        className="opacity-0 group-hover:opacity-100 p-2 text-muted hover:text-accent-danger transition-all -mt-2 -mr-2"
                        disabled={isDeleting}
                        title="ta bort inlägg"
                    >
                        <span className="text-sm">✕</span>
                    </button>
                )}
            </div>

            <div className="feed-content">
                {renderContent(post.content)}
            </div>

            {post.attachments.length > 0 && (
                <div className="feed-media">
                    <AttachmentList attachments={post.attachments} />
                </div>
            )}

            <div className="feed-actions">
                <button
                    onClick={() => handleReaction("LIKE")}
                    className={`feed-action-btn ${hasReacted("LIKE") ? "active" : ""}`}
                >
                    <span>👍</span>
                    <span>{reactionCount("LIKE") || "gilla"}</span>
                </button>
                <button
                    onClick={() => handleReaction("ROCKET")}
                    className={`feed-action-btn ${hasReacted("ROCKET") ? "active" : ""}`}
                >
                    <span>🚀</span>
                    <span>{reactionCount("ROCKET") || "raket"}</span>
                </button>
                <button
                    onClick={() => handleReaction("CELEBRATE")}
                    className={`feed-action-btn ${hasReacted("CELEBRATE") ? "active" : ""}`}
                >
                    <span>🎉</span>
                    <span>{reactionCount("CELEBRATE") || "fira"}</span>
                </button>

                <div className="ml-auto flex items-center">
                    <Link href={`/feed/${post.id}`} className="feed-action-btn hover:text-primary">
                        <span>💬</span>
                        <span>{post._count.comments} kommentarer</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
