"use client";

import { useState } from "react";
import { createFeedPost } from "@/lib/actions/feed";
import AttachmentPicker from "./attachment-picker";
import AttachmentList from "./attachment-list";

interface Props {
    user: { id: string; name: string };
}

export default function FeedComposer({ user }: Props) {
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
            window.location.reload();
        } else if (res.error) {
            alert(res.error);
        }
    }

    if (!isExpanded) {
        return (
            <div className="feed-card mb-10 p-4">
                <div className="flex items-center gap-4">
                    <div className="feed-avatar w-10 h-10">
                        {user.name[0].toUpperCase()}
                    </div>
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="feed-composer-input flex-1"
                    >
                        dela en ny insikt...
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="feed-card mb-10 transition-all duration-300 ring-1 ring-neon-green/10">
            <form onSubmit={handleSubmit}>
                <div className="p-4 flex gap-4">
                    <div className="feed-avatar w-10 h-10">
                        {user.name[0].toUpperCase()}
                    </div>
                    <textarea
                        autoFocus
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 min-h-[120px] resize-none text-bright"
                        placeholder="vad vill du dela med communityt idag?"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                </div>

                <div className="px-4 pb-4">
                    {pendingAttachments.length > 0 && (
                        <div className="mb-4 bg-secondary/5 rounded p-3">
                            <AttachmentList
                                attachments={pendingAttachments}
                                onRemove={(url) => setPendingAttachments(pendingAttachments.filter(a => a.url !== url))}
                            />
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-subtle">
                        <AttachmentPicker
                            onUploadSuccess={(url, file) => setPendingAttachments([...pendingAttachments, { url, name: file.name, mimeType: file.type, size: file.size }])}
                            onUploadError={(err) => alert(err)}
                            spaceId="feed"
                        />

                        <div className="flex gap-3">
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
                                {isSubmitting ? "postar..." : "publicera"}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
