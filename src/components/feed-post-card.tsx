"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import Link from "next/link";
import { deleteFeedPost, toggleFeedReaction } from "@/lib/actions/feed";
import AttachmentList from "./attachment-list";
import { Spinner } from "./ui/loading-components";

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
    post: any; // Changed from FeedPost to any as per instruction
    currentUserId: string;
}

import { ThumbsUp, Rocket, PartyPopper, MessageSquare, Trash2 } from "lucide-react";

export default function FeedPostCard({ post, currentUserId }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isReacting, setIsReacting] = useState(false);

    const hasReacted = (type: string) => post.reactions.some(r => r.userId === currentUserId && r.type === type);
    const reactionCount = (type: string) => post.reactions.filter(r => r.type === type).length;

    async function handleReaction(type: string) {
        if (isReacting) return;
        setIsReacting(true);
        const res = await toggleFeedReaction(post.id, type);
        if (res.success) {
            startTransition(() => {
                router.refresh();
                setIsReacting(false);
            });
        } else {
            setIsReacting(false);
        }
    }

    async function handleDelete() {
        if (!confirm("är du säker på att du vill ta bort detta inlägg?")) return;
        setIsDeleting(true);
        const res = await deleteFeedPost(post.id);
        if (res.success) {
            startTransition(() => {
                router.refresh();
                setIsDeleting(false);
            });
        } else {
            setIsDeleting(false);
            alert("Kunde inte ta bort inlägg");
        }
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
                <div className="feed-avatar border-none bg-primary/10 text-primary">
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
                        className={`opacity-0 group-hover:opacity-100 p-2 text-muted hover:text-accent-danger transition-all -mt-2 -mr-2 ${isDeleting ? "opacity-100" : ""}`}
                        disabled={isDeleting || isPending}
                        title="ta bort inlägg"
                    >
                        {isDeleting ? <Spinner size="sm" /> : <Trash2 size={16} strokeWidth={1.5} />}
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

            <div className={`feed-actions ${(isReacting || (isPending && !isDeleting)) ? "opacity-50 pointer-events-none" : ""}`}>
                <button
                    onClick={() => handleReaction("LIKE")}
                    className={`feed-action-btn ${hasReacted("LIKE") ? "active" : ""}`}
                    disabled={isReacting || isPending}
                >
                    <ThumbsUp size={16} strokeWidth={hasReacted("LIKE") ? 2 : 1.5} fill={hasReacted("LIKE") ? "currentColor" : "none"} />
                    <span>{reactionCount("LIKE") || "gilla"}</span>
                </button>
                <button
                    onClick={() => handleReaction("ROCKET")}
                    className={`feed-action-btn ${hasReacted("ROCKET") ? "active" : ""}`}
                    disabled={isReacting || isPending}
                >
                    <Rocket size={16} strokeWidth={hasReacted("ROCKET") ? 2 : 1.5} fill={hasReacted("ROCKET") ? "currentColor" : "none"} />
                    <span>{reactionCount("ROCKET") || "raket"}</span>
                </button>
                <button
                    onClick={() => handleReaction("CELEBRATE")}
                    className={`feed-action-btn ${hasReacted("CELEBRATE") ? "active" : ""}`}
                    disabled={isReacting || isPending}
                >
                    <PartyPopper size={16} strokeWidth={hasReacted("CELEBRATE") ? 2 : 1.5} fill={hasReacted("CELEBRATE") ? "currentColor" : "none"} />
                    <span>{reactionCount("CELEBRATE") || "fira"}</span>
                </button>

                <div className="ml-auto flex items-center">
                    <Link href={`/feed/${post.id}`} className="feed-action-btn hover:text-primary">
                        <MessageSquare size={16} strokeWidth={1.5} />
                        <span>{post._count.comments} kommentarer</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
