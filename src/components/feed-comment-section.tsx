"use client";

import { useState } from "react";
import { addFeedComment } from "@/lib/actions/feed";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import AttachmentList from "./attachment-list";
import AttachmentPicker from "./attachment-picker";

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: { name: string };
    attachments: any[];
}

interface Props {
    postId: string;
    comments: Comment[];
}

export default function FeedCommentSection({ postId, comments }: Props) {
    const [content, setContent] = useState("");
    const [pendingAttachments, setPendingAttachments] = useState<{ url: string; name: string; mimeType: string; size: number }[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!content.trim() && pendingAttachments.length === 0) return;

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append("content", content);
        if (pendingAttachments.length > 0) {
            formData.append("attachments", JSON.stringify(pendingAttachments));
        }

        const res = await addFeedComment(postId, formData);
        setIsSubmitting(false);

        if (res.success) {
            setContent("");
            setPendingAttachments([]);
            window.location.reload();
        }
    }

    return (
        <div className="mt-8">
            <h3 className="text-xs text-muted uppercase font-bold mb-4">Kommentarer ({comments.length})</h3>

            <div className="space-y-4 mb-8">
                {comments.map((comment) => (
                    <div key={comment.id} className="card card-compact bg-secondary/5">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-bright">{comment.user.name.toLowerCase()}</span>
                            <span className="text-[10px] text-muted">
                                {formatDistanceToNow(new Date(comment.createdAt), { locale: sv })} sedan
                            </span>
                        </div>
                        <div className="text-sm text-secondary whitespace-pre-wrap">{comment.content}</div>
                        {comment.attachments.length > 0 && (
                            <div className="mt-2">
                                <AttachmentList attachments={comment.attachments} />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="card">
                <form onSubmit={handleSubmit}>
                    <textarea
                        className="w-full bg-transparent border-none focus:ring-0 text-sm p-4 min-h-[80px] resize-none"
                        placeholder="skriv en kommentar..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />

                    {pendingAttachments.length > 0 && (
                        <div className="px-4 mb-4">
                            <AttachmentList
                                attachments={pendingAttachments}
                                onRemove={(url) => setPendingAttachments(pendingAttachments.filter(a => a.url !== url))}
                            />
                        </div>
                    )}

                    <div className="p-4 border-t border-subtle flex justify-between items-center">
                        <AttachmentPicker
                            onUploadSuccess={(url, file) => setPendingAttachments([...pendingAttachments, { url, name: file.name, mimeType: file.type, size: file.size }])}
                            onUploadError={(err) => alert(err)}
                            spaceId="feed-comments"
                        />
                        <button
                            type="submit"
                            className="btn btn-primary btn-sm"
                            disabled={isSubmitting || (!content.trim() && pendingAttachments.length === 0)}
                        >
                            {isSubmitting ? "skickar..." : "kommentera"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
