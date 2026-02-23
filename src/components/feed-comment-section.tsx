"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import { addFeedComment } from "@/lib/actions/feed";
import AttachmentPicker from "./attachment-picker";
import AttachmentList from "./attachment-list";
import { Spinner } from "./ui/loading-components";

interface Props {
    postId: string;
    comments: any[];
}

import { MessageSquare } from "lucide-react";

export default function FeedCommentSection({ postId, comments }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pendingAttachments, setPendingAttachments] = useState<{ url: string; name: string; mimeType: string; size: number }[]>([]);

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

    return (
        <div className="mt-8">
            <h3 className="text-xs text-muted uppercase font-bold mb-4 flex items-center gap-2">
                <MessageSquare size={14} strokeWidth={1.5} />
                Kommentarer ({comments.length})
            </h3>

            <div className="space-y-3 mb-8">
                {comments.map((comment) => (
                    <div key={comment.id} className="feed-card bg-secondary/5 border-none p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                {comment.user.name[0].toUpperCase()}
                            </div>
                            <span className="text-xs font-bold text-bright">{comment.user.name.toLowerCase()}</span>
                            <span className="text-[10px] text-muted ml-auto">
                                {formatDistanceToNow(new Date(comment.createdAt), { locale: sv })} sedan
                            </span>
                        </div>
                        <div className="text-sm text-secondary whitespace-pre-wrap leading-relaxed pl-8">{comment.content}</div>
                        {comment.attachments.length > 0 && (
                            <div className="mt-3 pl-8">
                                <AttachmentList attachments={comment.attachments} />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="feed-card bg-secondary/5 border-dashed">
                <form onSubmit={handleSubmit}>
                    <textarea
                        className="w-full bg-transparent border-none focus:ring-0 text-sm p-4 min-h-[100px] resize-none text-bright"
                        placeholder="skriv en meningsfull kommentar..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />

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
