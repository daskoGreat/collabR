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
            <div className="feed-card mb-10 p-5">
                <div className="flex items-center gap-4">
                    <div className="feed-avatar w-10 h-10 border-none bg-primary/10 text-primary">
                        {user.name[0].toUpperCase()}
                    </div>
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="feed-composer-input flex-1 hover:shadow-glow-sm"
                    >
                        dela en ny insikt eller fundering...
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="feed-card mb-10 transition-all duration-300 ring-1 ring-neon-green/5 shadow-glow-sm">
            <form onSubmit={handleSubmit}>
                <div className="p-5">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="feed-avatar w-10 h-10 border-none bg-primary/10 text-primary">
                            {user.name[0].toUpperCase()}
                        </div>
                        <div>
                            <div className="text-sm font-bold text-bright">{user.name.toLowerCase()}</div>
                            <div className="text-[10px] text-muted font-mono uppercase tracking-wider">delar en insikt</div>
                        </div>
                    </div>

                    <textarea
                        autoFocus
                        className="flex-1 feed-textarea resize-none min-h-[160px] w-full"
                        placeholder="vad vill du dela med communityt idag?"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                </div>

                <div className="px-5 pb-5">
                    {pendingAttachments.length > 0 && (
                        <div className="mb-4 bg-black/20 rounded p-3 border border-white/5">
                            <AttachmentList
                                attachments={pendingAttachments}
                                onRemove={(url) => setPendingAttachments(pendingAttachments.filter(a => a.url !== url))}
                            />
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <AttachmentPicker
                            onUploadSuccess={(url, file) => setPendingAttachments([...pendingAttachments, { url, name: file.name, mimeType: file.type, size: file.size }])}
                            onUploadError={(err) => alert(err)}
                            spaceId="feed"
                        />

                        <div className="flex gap-3">
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm text-muted hover:text-bright"
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
                                className="btn btn-primary btn-sm px-8 shadow-glow-sm"
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
