"use client";

import { useState } from "react";
import { createFeedPost } from "@/lib/actions/feed";
import AttachmentPicker from "./attachment-picker";
import AttachmentList from "./attachment-list";

export default function FeedComposer() {
    const [content, setContent] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);
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

        const res = await createFeedPost(formData);
        setIsSubmitting(false);

        if (res.success) {
            setContent("");
            setPendingAttachments([]);
            setIsExpanded(false);
            // In a real app we'd use Pusher or revalidate
            window.location.reload();
        } else if (res.error) {
            alert(res.error);
        }
    }

    return (
        <div className={`card mb-8 transition-all duration-200 ${isExpanded ? "ring-1 ring-primary/30" : ""}`}>
            <form onSubmit={handleSubmit}>
                <textarea
                    className="w-full bg-transparent border-none focus:ring-0 text-sm p-4 min-h-[100px] resize-none"
                    placeholder="dela en insikt, en länk eller en fundering..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onFocus={() => setIsExpanded(true)}
                />

                {isExpanded && (
                    <div className="p-4 border-t border-subtle bg-secondary/5">
                        {pendingAttachments.length > 0 && (
                            <div className="mb-4">
                                <AttachmentList
                                    attachments={pendingAttachments}
                                    onRemove={(url) => setPendingAttachments(pendingAttachments.filter(a => a.url !== url))}
                                />
                            </div>
                        )}

                        <div className="row-between">
                            <AttachmentPicker
                                onUploadSuccess={(url, file) => setPendingAttachments([...pendingAttachments, { url, name: file.name, mimeType: file.type, size: file.size }])}
                                onUploadError={(err) => alert(err)}
                                spaceId="feed"
                            />

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => {
                                        setIsExpanded(false);
                                        setContent("");
                                        setPendingAttachments([]);
                                    }}
                                >
                                    avbryt
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-sm px-6"
                                    disabled={isSubmitting || (!content.trim() && pendingAttachments.length === 0)}
                                >
                                    {isSubmitting ? "postar..." : "dela"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}
