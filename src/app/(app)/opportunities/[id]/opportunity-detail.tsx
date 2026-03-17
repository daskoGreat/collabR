"use client";

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { useRouter } from "next/navigation";
import BackButton from "@/components/back-button";
import MessageContent from "@/components/message-content";
import AttachmentList from "@/components/attachment-list";
import AttachmentPicker from "@/components/attachment-picker";
import { addOpportunityComment, deleteOpportunity } from "@/lib/actions/opportunities";
import MentionList from "@/components/mention-list";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Box } from "@/components/layout/Box";
import { Button } from "@/components/ui/button";
import { Trash2, Link as LinkIcon, Mail, Clock, MessageSquare } from "lucide-react";

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
    currentUserName?: string;
}

export default function OpportunityDetail({ opportunity, currentUserId, currentUserName }: Props) {
    const router = useRouter();
    const [commentRefreshing, setCommentRefreshing] = useState(false);
    const [pendingAttachments, setPendingAttachments] = useState<{ url: string; name: string; mimeType: string; size: number }[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [content, setContent] = useState("");

    // Mention state
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionUsers, setMentionUsers] = useState<User[]>([]);
    const [mentionIndex, setMentionIndex] = useState(0);
    const [mentionLoading, setMentionLoading] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const isCreator = opportunity.user.id === currentUserId;

    async function handleAddComment(e: React.FormEvent) {
        e.preventDefault();
        setCommentRefreshing(true);
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        if (pendingAttachments.length > 0) {
            formData.append("attachments", JSON.stringify(pendingAttachments));
        }
        const res = await addOpportunityComment(opportunity.id, formData);
        setCommentRefreshing(false);
        if (res?.success) {
            setPendingAttachments([]);
            setContent("");
        }
    }

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

    async function handleDelete() {
        if (!confirm("Are you sure you want to remove this opportunity?")) return;
        setIsDeleting(true);
        try {
            const res = await deleteOpportunity(opportunity.id);
            if (res?.success) {
                router.push("/opportunities");
            } else {
                setIsDeleting(false);
                alert(res?.error || "Could not remove opportunity");
            }
        } catch (err: any) {
            setIsDeleting(false);
            console.error(err);
            alert("An error occurred: " + (err.message || "Unknown error"));
        }
    }

    const isOpportunityMentioned = currentUserName && opportunity.content.toLowerCase().includes(`@${currentUserName.toLowerCase()}`);

    return (
        <Container style={{ paddingTop: 'var(--space-md)', paddingBottom: 'var(--space-2xl)', maxWidth: '800px' }}>
            <Stack direction="vertical" gap="lg">
                <Box>
                    <BackButton />
                </Box>

                <Card className={isOpportunityMentioned ? 'border-primary' : ''}>
                    <Stack direction="vertical" gap="lg">
                        <Stack direction="horizontal" justify="between" align="center">
                            <Stack direction="horizontal" gap="sm" align="center">
                                <Box style={{
                                    background: 'var(--bg-tertiary)',
                                    padding: 'var(--space-xs) var(--space-sm)',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border-subtle)'
                                }}>
                                    <Typography variant="caption" style={{ fontWeight: 'bold' }} className="uppercase tracking-widest">
                                        {opportunity.type.toLowerCase()}
                                    </Typography>
                                </Box>
                                <Typography variant="caption" className="text-secondary opacity-40 uppercase tracking-widest">
                                    {opportunity.location.toLowerCase()}
                                </Typography>
                            </Stack>
                            {isCreator && (
                                <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isDeleting} style={{ color: 'var(--accent-danger)' }}>
                                    <Trash2 size={14} style={{ marginRight: 'var(--space-xs)' }} />
                                    {isDeleting ? "Removing..." : "Remove"}
                                </Button>
                            )}
                        </Stack>

                        <Stack direction="vertical" gap="xs">
                            <Typography variant="h1">{opportunity.title.toLowerCase()}</Typography>
                            <Typography variant="caption" className="text-secondary opacity-60">
                                shared by <span className="text-secondary">{opportunity.user.name.toLowerCase()}</span> • {format(new Date(opportunity.createdAt), "PPP", { locale: sv })}
                            </Typography>
                        </Stack>

                        <Box style={{ opacity: 0.8, lineHeight: 1.6 }}>
                            <MessageContent content={opportunity.content} currentUserName={currentUserName} />
                        </Box>

                        <Stack direction="horizontal" gap="xs" wrap="wrap">
                            {opportunity.tags.map(tag => (
                                <Box key={tag} style={{ background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                                    <Typography variant="caption">{tag}</Typography>
                                </Box>
                            ))}
                        </Stack>

                        {(opportunity.link || opportunity.contactInfo || opportunity.deadline) && (
                            <Box style={{ background: 'var(--bg-tertiary)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                                <Stack direction="vertical" gap="md">
                                    {opportunity.link && (
                                        <Stack direction="vertical" gap="none">
                                            <Typography variant="caption" style={{ fontWeight: 'bold' }} className="uppercase tracking-widest opacity-40">Link</Typography>
                                            <a href={opportunity.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-accent)', textDecoration: 'none' }} className="hover:underline break-all">
                                                {opportunity.link}
                                            </a>
                                        </Stack>
                                    )}
                                    {opportunity.contactInfo && (
                                        <Stack direction="vertical" gap="none">
                                            <Typography variant="caption" style={{ fontWeight: 'bold' }} className="uppercase tracking-widest opacity-40">Contact</Typography>
                                            <Typography variant="body">{opportunity.contactInfo}</Typography>
                                        </Stack>
                                    )}
                                    {opportunity.deadline && (
                                        <Stack direction="vertical" gap="none">
                                            <Typography variant="caption" style={{ fontWeight: 'bold' }} className="uppercase tracking-widest opacity-40">Deadline</Typography>
                                            <Typography variant="body" style={{ color: 'var(--accent-warning)', fontWeight: 'bold' }}>{format(new Date(opportunity.deadline), "PPP", { locale: sv })}</Typography>
                                        </Stack>
                                    )}
                                </Stack>
                            </Box>
                        )}

                        {opportunity.attachments.length > 0 && (
                            <Stack direction="vertical" gap="sm">
                                <Typography variant="caption" style={{ fontWeight: 'bold' }} className="uppercase tracking-widest opacity-40">Attachments</Typography>
                                <AttachmentList attachments={opportunity.attachments} />
                            </Stack>
                        )}
                    </Stack>
                </Card>

                {/* Discussion Section */}
                <Stack direction="vertical" gap="md">
                    <Stack direction="horizontal" gap="xs" align="center">
                        <MessageSquare size={16} className="text-secondary opacity-40" />
                        <Typography variant="h3">Discussion ({opportunity.comments.length})</Typography>
                    </Stack>

                    <Stack direction="vertical" gap="md">
                        {opportunity.comments.map(comment => {
                            const isCommentMentioned = currentUserName && comment.content.toLowerCase().includes(`@${currentUserName.toLowerCase()}`);
                            return (
                                <Card key={comment.id} className={isCommentMentioned ? 'border-primary' : ''} style={{ background: 'var(--bg-tertiary)' }}>
                                    <Stack direction="vertical" gap="sm">
                                        <Stack direction="horizontal" justify="between" align="center">
                                            <Typography variant="caption" style={{ fontWeight: 'bold' }}>{comment.user.name.toLowerCase()}</Typography>
                                            <Typography variant="caption" className="text-secondary opacity-40">{format(new Date(comment.createdAt), "HH:mm, PPP", { locale: sv })}</Typography>
                                        </Stack>
                                        <Box style={{ opacity: 0.9 }}>
                                            <MessageContent content={comment.content} currentUserName={currentUserName} />
                                        </Box>
                                        {comment.attachments.length > 0 && (
                                            <AttachmentList attachments={comment.attachments} />
                                        )}
                                    </Stack>
                                </Card>
                            );
                        })}
                        {opportunity.comments.length === 0 && (
                            <Box style={{ textAlign: 'center', padding: 'var(--space-lg) 0', opacity: 0.4 }}>
                                <Typography variant="caption" className="italic">No comments yet. Start the conversation.</Typography>
                            </Box>
                        )}
                    </Stack>

                    {/* Add Comment Card */}
                    <Card style={{ background: 'var(--bg-secondary)' }}>
                        <form onSubmit={handleAddComment}>
                            <Stack direction="vertical" gap="md">
                                <Box style={{ position: 'relative' }}>
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
                                        name="content"
                                        className="input"
                                        rows={3}
                                        placeholder="Add a comment... use @ to tag someone"
                                        required
                                        value={content}
                                        onChange={(e) => handleInputChange(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        style={{ width: '100%', resize: 'vertical' }}
                                    />
                                </Box>

                                <Stack direction="horizontal" justify="between" align="end">
                                    <Box style={{ flex: 1 }}>
                                        <AttachmentList
                                            attachments={pendingAttachments}
                                            onRemove={(url) => setPendingAttachments(pendingAttachments.filter(a => a.url !== url))}
                                        />
                                        <Box style={{ paddingTop: '8px' }}>
                                            <AttachmentPicker
                                                onUploadSuccess={(url, file) => setPendingAttachments([...pendingAttachments, { url, name: file.name, mimeType: file.type, size: file.size }])}
                                                onUploadError={(err) => alert(err)}
                                                spaceId="opportunities"
                                            />
                                        </Box>
                                    </Box>
                                    <Button type="submit" disabled={commentRefreshing} variant="primary">
                                        {commentRefreshing ? "Sending..." : "Send Comment"}
                                    </Button>
                                </Stack>
                            </Stack>
                        </form>
                    </Card>
                </Stack>
            </Stack>
        </Container>
    );
}
