"use client";

import { useState } from "react";
import { format } from "date-fns";
import BackButton from "@/components/back-button";
import MessageContent from "@/components/message-content";
import AttachmentList from "@/components/attachment-list";
import AttachmentPicker from "@/components/attachment-picker";
import { addOpportunityComment, deleteOpportunity } from "@/lib/actions/opportunities";
import { useRouter } from "next/navigation";

interface User {
    id: string;
    name: string;
}

interface Attachment {
    id: string;
    url: string;
    name: string;
    mimeType: string;
    size: number;
}

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: User;
    attachments: Attachment[];
}

interface Opportunity {
    id: string;
    title: string;
    content: string;
    type: "JOBB" | "LIA" | "UPPDRAG";
    location: "REMOTE" | "HYBRID" | "ONSITE";
    tags: string[];
    link: string | null;
    contactInfo: string | null;
    deadline: string | null;
    createdAt: string;
    user: User;
    attachments: Attachment[];
    comments: Comment[];
}

interface Props {
    opportunity: Opportunity;
    currentUserId: string;
}

export default function OpportunityDetail({ opportunity, currentUserId }: Props) {
    const router = useRouter();
    const [commentRefreshing, setCommentRefreshing] = useState(false);
    const [pendingAttachments, setPendingAttachments] = useState<{ url: string; name: string; mimeType: string; size: number }[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);

    const isCreator = opportunity.user.id === currentUserId;

    async function handleAddComment(formData: FormData) {
        setCommentRefreshing(true);
        if (pendingAttachments.length > 0) {
            formData.append("attachments", JSON.stringify(pendingAttachments));
        }
        const res = await addOpportunityComment(opportunity.id, formData);
        setCommentRefreshing(false);
        if (res?.success) {
            setPendingAttachments([]);
            // revalidatePath in server action handles server refresh
        }
    }

    async function handleDelete() {
        if (!confirm("Är du säker på att du vill ta bort denna möjlighet?")) return;
        setIsDeleting(true);
        const res = await deleteOpportunity(opportunity.id);
        if (res?.success) {
            router.push("/opportunities");
        } else {
            setIsDeleting(false);
        }
    }

    return (
        <div className="content-area max-w-4xl mx-auto">
            <div className="mb-4">
                <BackButton />
            </div>

            <div className="card mb-8">
                <div className="row-between mb-4">
                    <div className="flex items-center gap-3">
                        <span className={`badge badge-type status-${opportunity.type.toLowerCase()}`}>
                            {opportunity.type}
                        </span>
                        <span className="text-sm text-muted">
                            {opportunity.location.toLowerCase()}
                        </span>
                    </div>
                    {isCreator && (
                        <button
                            className="btn btn-secondary text-error btn-sm"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "tar bort..." : "ta bort"}
                        </button>
                    )}
                </div>

                <h1 className="text-3xl font-bold text-bright mb-2">
                    {opportunity.title}
                </h1>

                <div className="flex items-center gap-2 text-sm text-muted mb-6">
                    <span>publicerad av <span className="text-secondary">{opportunity.user.name}</span></span>
                    <span>•</span>
                    <span>{format(new Date(opportunity.createdAt), "PPP")}</span>
                </div>

                <div className="prose prose-invert mb-8">
                    <MessageContent content={opportunity.content} />
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                    {opportunity.tags.map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                    ))}
                </div>

                {(opportunity.link || opportunity.contactInfo || opportunity.deadline) && (
                    <div className="grid grid-2 gap-4 p-4 bg-tertiary rounded-lg mb-8 border border-subtle">
                        {opportunity.link && (
                            <div>
                                <div className="text-xs text-muted uppercase font-bold mb-1">länk</div>
                                <a href={opportunity.link} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline break-all">
                                    {opportunity.link}
                                </a>
                            </div>
                        )}
                        {opportunity.contactInfo && (
                            <div>
                                <div className="text-xs text-muted uppercase font-bold mb-1">kontakt</div>
                                <div className="text-secondary">{opportunity.contactInfo}</div>
                            </div>
                        )}
                        {opportunity.deadline && (
                            <div>
                                <div className="text-xs text-muted uppercase font-bold mb-1">deadline</div>
                                <div className="text-orange">{format(new Date(opportunity.deadline), "PPP")}</div>
                            </div>
                        )}
                    </div>
                )}

                {opportunity.attachments.length > 0 && (
                    <div className="mb-8">
                        <h4 className="text-xs text-muted uppercase font-bold mb-3">bilagor</h4>
                        <AttachmentList attachments={opportunity.attachments} />
                    </div>
                )}
            </div>

            {/* Comments Section */}
            <div className="comments-section">
                <h3 className="text-xl font-bold text-bright mb-6">
                    diskussion ({opportunity.comments.length})
                </h3>

                <div className="stack gap-4 mb-8">
                    {opportunity.comments.map(comment => (
                        <div key={comment.id} className="card card-compact border-l-2 border-l-neon-green bg-tertiary">
                            <div className="row-between mb-2">
                                <span className="font-bold text-secondary text-sm">{comment.user.name}</span>
                                <span className="text-xs text-muted">{format(new Date(comment.createdAt), "HH:mm, PPP")}</span>
                            </div>
                            <div className="text-sm">
                                <MessageContent content={comment.content} />
                            </div>
                            {comment.attachments.length > 0 && (
                                <div className="mt-4">
                                    <AttachmentList attachments={comment.attachments} />
                                </div>
                            )}
                        </div>
                    ))}
                    {opportunity.comments.length === 0 && (
                        <p className="text-muted text-center py-8">inga kommentarer än. bli den första!</p>
                    )}
                </div>

                <div className="card bg-secondary">
                    <form action={handleAddComment}>
                        <div className="form-group mb-4">
                            <textarea
                                name="content"
                                className="input w-full"
                                rows={3}
                                placeholder="skriv en kommentar... använd @ för att tagga någon"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <div className="row-between items-end">
                                <div className="flex-1">
                                    <AttachmentList
                                        attachments={pendingAttachments}
                                        onRemove={(url) => setPendingAttachments(pendingAttachments.filter(a => a.url !== url))}
                                    />
                                    <div className="pt-2">
                                        <AttachmentPicker
                                            onUploadSuccess={(url, file) => setPendingAttachments([...pendingAttachments, { url, name: file.name, mimeType: file.type, size: file.size }])}
                                            onUploadError={(err) => alert(err)}
                                            spaceId="opportunities"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={commentRefreshing}
                                >
                                    {commentRefreshing ? "skickar..." : "skicka"}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
