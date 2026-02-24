"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import { addFeedComment } from "@/lib/actions/feed";
import AttachmentPicker from "./attachment-picker";
import AttachmentList from "./attachment-list";
import { Spinner } from "./ui/loading-components";
import MentionList from "./mention-list";
import MessageContent from "./message-content";
import { MessageSquare } from "lucide-react";

interface User {
    id: string;
    name: string;
}

interface Props {
    postId: string;
    comments: any[];
    currentUserName?: string;
}

export default function FeedCommentSection({ postId, comments, currentUserName }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pendingAttachments, setPendingAttachments] = useState<{ url: string; name: string; mimeType: string; size: number }[]>([]);

    // Mention state
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionUsers, setMentionUsers] = useState<User[]>([]);
    const [mentionIndex, setMentionIndex] = useState(0);
    const [mentionLoading, setMentionLoading] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!content.trim() && pendingAttachments.length === 0) return;

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append("postId", postId);
        formData.append("content", content);
        if (pendingAttachments.length > 0) {
            formData.append("attachments", JSON.stringify(pendingAttachments));
        }

        const res = await addFeedComment(postId, formData);

        if (res.success) {
            startTransition(() => {
                router.refresh();
                setContent("");
                setPendingAttachments([]);
                setIsSubmitting(false);
            });
        } else {
            setIsSubmitting(false);
            alert("Kunde inte skicka kommentar");
        }
    }

    // Mention handlers
    const handleInputChange = (val: string) => {
        setContent(val);
        const cursorPosition = inputRef.current?.selectionStart || 0;
        const textBeforeCursor = val.slice(0, cursorPosition);
        const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

        if (mentionMatch) {
            setMentionQuery(mentionMatch[1]);
            setMentionIndex(0);
        } else {
            setMentionQuery(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (mentionQuery !== null && mentionUsers.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setMentionIndex((prev) => (prev + 1) % mentionUsers.length);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setMentionIndex((prev) => (prev - 1 + mentionUsers.length) % mentionUsers.length);
            } else if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                insertMention(mentionUsers[mentionIndex]);
            } else if (e.key === "Escape") {
                setMentionQuery(null);
            }
        }
    };

    const insertMention = (targetUser: User) => {
        if (!inputRef.current) return;
        const cursorPosition = inputRef.current.selectionStart || 0;
        const textBeforeCursor = content.slice(0, cursorPosition);
        const textAfterCursor = content.slice(cursorPosition);
        const lastAtIndex = textBeforeCursor.lastIndexOf("@");

        const newText = textBeforeCursor.slice(0, lastAtIndex) + `@${targetUser.name} ` + textAfterCursor;
        setContent(newText);
        setMentionQuery(null);

        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                const newPos = lastAtIndex + targetUser.name.length + 2;
                inputRef.current.selectionStart = newPos;
                inputRef.current.selectionEnd = newPos;
            }
        }, 0);
    };

    useEffect(() => {
        if (mentionQuery === null) return;
        const timer = setTimeout(async () => {
            setMentionLoading(true);
            try {
                const res = await fetch(`/api/users/search?q=${mentionQuery}`);
                if (res.ok) {
                    const data = await res.json();
                    setMentionUsers(data);
                }
            } catch (err) {
                console.error("Mention search failed:", err);
            } finally {
                setMentionLoading(false);
            }
        }, 200);
        return () => clearTimeout(timer);
    }, [mentionQuery]);

    return (
        <div className="mt-8">
            <h3 className="text-xs text-muted uppercase font-bold mb-4 flex items-center gap-2">
                <MessageSquare size={14} strokeWidth={1.5} />
                Kommentarer ({comments.length})
            </h3>

            <div className="space-y-3 mb-8">
                {comments.map((comment) => {
                    const isMentioned = currentUserName && comment.content.toLowerCase().includes(`@${currentUserName.toLowerCase()}`);
                    return (
                        <div key={comment.id} className={`feed-card bg-secondary/5 border-none p-3 ${isMentioned ? "chat-message-mentioned" : ""}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                    {comment.user.name[0].toUpperCase()}
                                </div>
                                <span className="text-xs font-bold text-bright">{comment.user.name.toLowerCase()}</span>
                                <span className="text-[10px] text-muted ml-auto">
                                    {formatDistanceToNow(new Date(comment.createdAt), { locale: sv })} sedan
                                </span>
                            </div>
                            <div className="pl-8">
                                <MessageContent content={comment.content} currentUserName={currentUserName} />
                            </div>
                            {comment.attachments.length > 0 && (
                                <div className="mt-3 pl-8">
                                    <AttachmentList attachments={comment.attachments} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="feed-card bg-secondary/5 border-dashed relative">
                <form onSubmit={handleSubmit}>
                    <div className="relative">
                        {mentionQuery !== null && (
                            <MentionList
                                users={mentionUsers}
                                selectedIndex={mentionIndex}
                                onSelect={(u) => insertMention(u)}
                                loading={mentionLoading}
                            />
                        )}
                        <textarea
                            ref={inputRef}
                            className="w-full bg-transparent border-none focus:ring-0 text-sm p-4 min-h-[100px] resize-none text-bright"
                            placeholder="skriv en meningsfull kommentar..."
                            value={content}
                            onChange={(e) => handleInputChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>

                    <div className="px-4 pb-4">
                        {pendingAttachments.length > 0 && (
                            <div className="mb-4 bg-black/20 rounded p-2">
                                <AttachmentList
                                    attachments={pendingAttachments}
                                    onRemove={(url) => setPendingAttachments(pendingAttachments.filter(a => a.url !== url))}
                                />
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-2">
                            <AttachmentPicker
                                onUploadSuccess={(url, file) => setPendingAttachments([...pendingAttachments, { url, name: file.name, mimeType: file.type, size: file.size }])}
                                onUploadError={(err) => alert(err)}
                                spaceId="feed-comments"
                            />
                            <button
                                type="submit"
                                className="btn btn-primary btn-sm px-8 min-w-[120px]"
                                disabled={isSubmitting || isPending || (!content.trim() && pendingAttachments.length === 0)}
                            >
                                {isSubmitting || isPending ? (
                                    <div className="flex items-center gap-2">
                                        <Spinner size="sm" />
                                        <span>skickar...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <MessageSquare size={14} strokeWidth={1.5} />
                                        <span>kommentera</span>
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
