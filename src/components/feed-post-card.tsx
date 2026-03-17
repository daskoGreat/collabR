"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import Link from "next/link";
import { deleteFeedPost, toggleFeedReaction } from "@/lib/actions/feed";
import AttachmentList from "./attachment-list";
import { AvatarPreview } from "./avatar-builder/AvatarPreview";
import { Box } from "./layout/Box";
import { Typography } from "./ui/typography";
import { Stack } from "./layout/Stack";

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
        <Box
            style={{
                background: "rgba(255,255,255,0.02)",
                borderRadius: "32px",
                border: "1px solid rgba(255,255,255,0.05)",
                padding: "2.5rem",
                transition: "all 0.3s"
            }}
            className={`group hover:bg-white/[0.04] hover:border-white/10 ${isMentioned ? "chat-message-mentioned" : ""}`}
        >
            <Stack direction="horizontal" gap={16} align="center" style={{ marginBottom: "2rem" }}>
                <AvatarPreview
                    avatarId={post.user.avatarConfig?.avatarId}
                    name={post.user.name}
                    size="md"
                />
                <Box style={{ flex: 1 }}>
                    <Typography style={{ fontWeight: 700, fontSize: "1.1rem", color: "white" }}>{post.user.name.toLowerCase()}</Typography>
                    <Typography style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {formatDistanceToNow(new Date(post.createdAt), { locale: sv })} sedan
                    </Typography>
                </Box>

                {post.user.id === currentUserId && (
                    <button
                        onClick={handleDelete}
                        className={`opacity-0 group-hover:opacity-40 p-2 text-muted hover:text-accent-danger hover:opacity-100 transition-all duration-200 ${isDeleting ? "opacity-100" : ""}`}
                        disabled={isDeleting || isPending}
                        title="ta bort inlägg"
                    >
                        {isDeleting ? "..." : <Trash2 size={16} strokeWidth={1.5} />}
                    </button>
                )}
            </Stack>

            <Box style={{ marginBottom: "2.5rem" }}>
                <MessageContent content={post.content} currentUserName={currentUserName} />
            </Box>

            {post.attachments.length > 0 && (
                <div className="feed-media mb-[var(--space-6)]">
                    <AttachmentList attachments={post.attachments} />
                </div>
            )}

            <div className={`feed-actions border-t border-subtle/30 pt-[var(--space-4)] flex flex-wrap gap-[var(--space-1)] ${(isReacting || (isPending && !isDeleting)) ? "opacity-50 pointer-events-none" : ""}`}>
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
        </Box>
    );
}
