"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import Link from "next/link";
import { deleteFeedPost, toggleFeedReaction } from "@/lib/actions/feed";
import AttachmentList from "./attachment-list";
import { LoadingSpinner } from "./ui/loading-spinner";

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
    post: any;
    currentUserId: string;
    currentUserName?: string;
}

import { ThumbsUp, Rocket, PartyPopper, MessageSquare, Trash2 } from "lucide-react";
import MessageContent from "./message-content";

export default function FeedPostCard({ post, currentUserId, currentUserName }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isReacting, setIsReacting] = useState(false);

    const hasReacted = (type: string) => post.reactions.some((r: any) => r.userId === currentUserId && r.type === type);
    const reactionCount = (type: string) => post.reactions.filter((r: any) => r.type === type).length;

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

    const isMentioned = currentUserName && post.content.toLowerCase().includes(`@${currentUserName.toLowerCase()}`);

    return (
        <div className={`feed-card group transition-all duration-300 hover:shadow-glow-sm ${isMentioned ? "chat-message-mentioned" : ""}`}>
            <div className="feed-header mb-6">
                <div className="feed-avatar !w-10 !h-10 !text-[13px]">
                    {post.user.name[0].toUpperCase()}
                </div>
                <div className="feed-meta">
                    <div className="feed-author text-[15px] font-semibold text-bright">{post.user.name.toLowerCase()}</div>
                    <div className="feed-time text-[10px] uppercase tracking-wider text-muted opacity-60">
                        {formatDistanceToNow(new Date(post.createdAt), { locale: sv })} sedan
                    </div>
                </div>

                {post.user.id === currentUserId && (
                    <button
                        onClick={handleDelete}
                        className={`opacity-0 group-hover:opacity-40 p-2 text-muted hover:text-accent-danger hover:opacity-100 transition-all duration-200 -mt-2 -mr-2 ${isDeleting ? "opacity-100" : ""}`}
                        disabled={isDeleting || isPending}
                        title="ta bort inlägg"
                    >
                        {isDeleting ? <LoadingSpinner size={14} /> : <Trash2 size={14} strokeWidth={1.5} />}
                    </button>
                )}
            </div>

            <div className="feed-content mb-6">
                <MessageContent content={post.content} currentUserName={currentUserName} />
            </div>

            {post.attachments.length > 0 && (
                <div className="feed-media mb-6">
                    <AttachmentList attachments={post.attachments} />
                </div>
            )}

            <div className={`feed-actions border-t border-subtle/30 pt-4 flex flex-wrap gap-1.5 ${(isReacting || (isPending && !isDeleting)) ? "opacity-50 pointer-events-none" : ""}`}>
                <button
                    onClick={() => handleReaction("LIKE")}
                    className={`feed-action-btn transition-colors duration-200 !px-2 !py-1 !rounded-md ${hasReacted("LIKE") ? "active text-accent-primary bg-accent-primary/5" : "hover:text-accent-primary hover:bg-white/5"}`}
                    disabled={isReacting || isPending}
                >
                    <ThumbsUp size={14} strokeWidth={hasReacted("LIKE") ? 2 : 1.5} fill={hasReacted("LIKE") ? "currentColor" : "none"} />
                    <span className="font-mono text-[11px] font-medium">{reactionCount("LIKE") || "gilla"}</span>
                </button>
                <button
                    onClick={() => handleReaction("ROCKET")}
                    className={`feed-action-btn transition-colors duration-200 !px-2 !py-1 !rounded-md ${hasReacted("ROCKET") ? "active text-accent-secondary bg-accent-secondary/5" : "hover:text-accent-secondary hover:bg-white/5"}`}
                    disabled={isReacting || isPending}
                >
                    <Rocket size={14} strokeWidth={hasReacted("ROCKET") ? 2 : 1.5} fill={hasReacted("ROCKET") ? "currentColor" : "none"} />
                    <span className="font-mono text-[11px] font-medium">{reactionCount("ROCKET") || "raket"}</span>
                </button>
                <button
                    onClick={() => handleReaction("CELEBRATE")}
                    className={`feed-action-btn transition-colors duration-200 !px-2 !py-1 !rounded-md ${hasReacted("CELEBRATE") ? "active text-accent-warning bg-accent-warning/5" : "hover:text-accent-warning hover:bg-white/5"}`}
                    disabled={isReacting || isPending}
                >
                    <PartyPopper size={14} strokeWidth={hasReacted("CELEBRATE") ? 2 : 1.5} fill={hasReacted("CELEBRATE") ? "currentColor" : "none"} />
                    <span className="font-mono text-[11px] font-medium">{reactionCount("CELEBRATE") || "fira"}</span>
                </button>
                <div className="ml-auto">
                    <Link href={`/feed/${post.id}`} className="feed-action-btn !px-2 !py-1 !rounded-md hover:text-bright hover:bg-white/5 transition-all duration-200 flex items-center gap-2">
                        <MessageSquare size={14} strokeWidth={1.5} className="opacity-50" />
                        <span className="font-mono text-[11px] font-medium">{post._count.comments} kommentarer</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
