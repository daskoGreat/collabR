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
        <div className="feed-card group transition-all duration-300 hover:shadow-glow-sm">
            <div className="feed-header mb-4">
                <div className="feed-avatar border-none bg-primary/10 text-primary font-bold">
                    {post.user.name[0].toUpperCase()}
                </div>
                <div className="feed-meta">
                    <div className="feed-author font-bold text-bright">{post.user.name.toLowerCase()}</div>
                    <div className="feed-time text-xs opacity-50 font-mono">
                        {formatDistanceToNow(new Date(post.createdAt), { locale: sv })} sedan
                    </div>
                </div>

                {post.user.id === currentUserId && (
                    <button
                        onClick={handleDelete}
                        className={`opacity-0 group-hover:opacity-100 p-2 text-muted hover:text-accent-danger transition-all duration-200 -mt-2 -mr-2 ${isDeleting ? "opacity-100" : ""}`}
                        disabled={isDeleting || isPending}
                        title="ta bort inlägg"
                    >
                        {isDeleting ? <Spinner size="sm" /> : <Trash2 size={16} strokeWidth={1.5} />}
                    </button>
                )}
            </div>

            <div className="feed-content text-md leading-relaxed mb-6">
                {renderContent(post.content)}
            </div>

            {post.attachments.length > 0 && (
                <div className="feed-media mb-6">
                    <AttachmentList attachments={post.attachments} />
                </div>
            )}

            <div className={`feed-actions border-t border-subtle pt-4 flex flex-wrap gap-2 ${(isReacting || (isPending && !isDeleting)) ? "opacity-50 pointer-events-none" : ""}`}>
                <button
                    onClick={() => handleReaction("LIKE")}
                    className={`feed-action-btn transition-colors duration-200 ${hasReacted("LIKE") ? "active text-accent-primary" : "hover:text-accent-primary"}`}
                    disabled={isReacting || isPending}
                >
                    <ThumbsUp size={16} strokeWidth={hasReacted("LIKE") ? 2 : 1.5} fill={hasReacted("LIKE") ? "currentColor" : "none"} />
                    <span className="font-mono text-xs">{reactionCount("LIKE") || "gilla"}</span>
                </button>
                <button
                    onClick={() => handleReaction("ROCKET")}
                    className={`feed-action-btn transition-colors duration-200 ${hasReacted("ROCKET") ? "active text-accent-secondary" : "hover:text-accent-secondary"}`}
                    disabled={isReacting || isPending}
                >
                    <Rocket size={16} strokeWidth={hasReacted("ROCKET") ? 2 : 1.5} fill={hasReacted("ROCKET") ? "currentColor" : "none"} />
                    <span className="font-mono text-xs">{reactionCount("ROCKET") || "raket"}</span>
                </button>
                <button
                    onClick={() => handleReaction("CELEBRATE")}
                    className={`feed-action-btn transition-colors duration-200 ${hasReacted("CELEBRATE") ? "active text-accent-warning" : "hover:text-accent-warning"}`}
                    disabled={isReacting || isPending}
                >
                    <PartyPopper size={16} strokeWidth={hasReacted("CELEBRATE") ? 2 : 1.5} fill={hasReacted("CELEBRATE") ? "currentColor" : "none"} />
                    <span className="font-mono text-xs">{reactionCount("CELEBRATE") || "fira"}</span>
                </button>

                <div className="ml-auto flex items-center">
                    <Link href={`/feed/${post.id}`} className="feed-action-btn hover:text-bright transition-colors duration-200">
                        <MessageSquare size={16} strokeWidth={1.5} />
                        <span className="font-mono text-xs">{post._count.comments} kommentarer</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
