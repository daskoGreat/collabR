"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import MentionList from "./mention-list";
import OpportunityCard from "./opportunity-card";
import { createOpportunity } from "@/lib/actions/opportunities";
import AttachmentPicker from "./attachment-picker";
import AttachmentList from "./attachment-list";
import { LoadingSpinner } from "./ui/loading-spinner";
import { PlusSquare, Zap, Search, Filter } from "lucide-react";
import { Stack } from "@/components/layout/Stack";
import { Grid, GridItem } from "@/components/layout/Grid";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Box } from "@/components/layout/Box";

interface User {
    id: string;
    name: string;
}

interface Opportunity {
    id: string;
    title: string;
    content: string;
    type: "JOBB" | "LIA" | "UPPDRAG";
    location: "REMOTE" | "HYBRID" | "ONSITE";
    tags: string[];
    deadline: string | null;
    user: { name: string };
    createdAt: string;
}

interface Props {
    initialOpportunities: Opportunity[];
    currentUserName?: string;
}

export default function OpportunityBoard({ initialOpportunities, currentUserName }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("ALL");
    const [locationFilter, setLocationFilter] = useState<string>("ALL");
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [pendingAttachments, setPendingAttachments] = useState<{ url: string; name: string; mimeType: string; size: number }[]>([]);
    const [content, setContent] = useState("");

    // Mention state
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionUsers, setMentionUsers] = useState<User[]>([]);
    const [mentionIndex, setMentionIndex] = useState(0);
    const [mentionLoading, setMentionLoading] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const filtered = initialOpportunities.filter((o) => {
        const matchesSearch = o.title.toLowerCase().includes(search.toLowerCase()) ||
            o.content.toLowerCase().includes(search.toLowerCase()) ||
            o.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
        const matchesType = typeFilter === "ALL" || o.type === typeFilter;
        const matchesLocation = locationFilter === "ALL" || o.location === locationFilter;
        return matchesSearch && matchesType && matchesLocation;
    });

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setCreating(true);
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        if (pendingAttachments.length > 0) {
            formData.append("attachments", JSON.stringify(pendingAttachments));
        }

        const res = await createOpportunity(formData);

        if (res?.success) {
            startTransition(() => {
                router.refresh();
                setShowCreate(false);
                setPendingAttachments([]);
                setContent("");
                setCreating(false);
            });
        } else {
            setCreating(false);
            alert("Could not share opportunity");
        }
    }

    const handleInputChange = (val: string) => {
        setContent(val);
        const cursorPosition = inputRef.current?.selectionStart || 0;
        const textBeforeCursor = val.slice(0, cursorPosition);
        const mentionMatch = textBeforeCursor.match(/@([\wåäöÅÄÖ]*)$/);

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
        <Stack direction="vertical" gap="lg">
            {/* ACTION BAR */}
            <Stack direction="horizontal" justify="between" align="center">
                <Typography variant="h3">Active Opportunities</Typography>
                <Button onClick={() => setShowCreate(!showCreate)} variant={showCreate ? "secondary" : "primary"}>
                    <PlusSquare size={16} style={{ marginRight: 'var(--space-xs)' }} />
                    {showCreate ? "Cancel" : "Share Opportunity"}
                </Button>
            </Stack>

            {/* CREATE FORM */}
            {showCreate && (
                <Card style={{ border: '1px solid var(--accent-accent)' }}>
                    <form onSubmit={handleCreate}>
                        <Stack direction="vertical" gap="md">
                            <Typography variant="h3">New Opportunity</Typography>

                            <Grid gap="md">
                                <GridItem span={12}>
                                    <Input label="Title" name="title" placeholder="e.g. Senior Frontend Developer" required />
                                </GridItem>
                                <GridItem span={6}>
                                    <Stack direction="vertical" gap="xs">
                                        <Typography variant="caption" style={{ fontWeight: 'bold' }}>Type</Typography>
                                        <select name="type" className="input w-full" style={{ background: 'var(--bg-tertiary)' }}>
                                            <option value="JOBB">Job</option>
                                            <option value="LIA">Internship (LIA)</option>
                                            <option value="UPPDRAG">Freelance</option>
                                        </select>
                                    </Stack>
                                </GridItem>
                                <GridItem span={6}>
                                    <Stack direction="vertical" gap="xs">
                                        <Typography variant="caption" style={{ fontWeight: 'bold' }}>Location</Typography>
                                        <select name="location" className="input w-full" style={{ background: 'var(--bg-tertiary)' }}>
                                            <option value="REMOTE">Remote</option>
                                            <option value="HYBRID">Hybrid</option>
                                            <option value="ONSITE">Onsite</option>
                                        </select>
                                    </Stack>
                                </GridItem>

                                <GridItem span={12}>
                                    <Stack direction="vertical" gap="xs">
                                        <Typography variant="caption" style={{ fontWeight: 'bold' }}>Description</Typography>
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
                                                rows={5}
                                                placeholder="Tell us more about the role, requirements, and offerings..."
                                                required
                                                value={content}
                                                onChange={(e) => handleInputChange(e.target.value)}
                                                onKeyDown={handleKeyDown}
                                                style={{ width: '100%', resize: 'vertical' }}
                                            />
                                        </Box>
                                    </Stack>
                                </GridItem>

                                <GridItem span={6}>
                                    <Input label="Tags (comma-separated)" name="tags" placeholder="react, design, typescript" />
                                </GridItem>
                                <GridItem span={6}>
                                    <Input label="Apply Link (optional)" type="url" name="link" placeholder="https://..." />
                                </GridItem>
                                <GridItem span={6}>
                                    <Input label="Deadline (optional)" type="date" name="deadline" />
                                </GridItem>
                            </Grid>

                            <Stack direction="horizontal" justify="end" gap="md" style={{ marginTop: 'var(--space-md)' }}>
                                <Button type="submit" disabled={creating || isPending} size="lg">
                                    {creating || isPending ? "Sharing..." : "Share Now"}
                                </Button>
                            </Stack>
                        </Stack>
                    </form>
                </Card>
            )}

            {/* FILTERS CARD */}
            <Card style={{ background: 'var(--bg-tertiary)' }}>
                <Stack direction="vertical" gap="md">
                    <Box style={{ position: 'relative' }}>
                        <Search size={14} className="text-secondary opacity-40" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text"
                            placeholder="Search among jobs, internships, and projects..."
                            className="input w-full"
                            style={{ paddingLeft: '36px', height: '40px', background: 'var(--bg-primary)' }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </Box>

                    <Stack direction="horizontal" gap="xl" wrap="wrap">
                        <Stack direction="horizontal" gap="md" align="center">
                            <Typography variant="caption" style={{ fontWeight: 'bold' }} className="uppercase tracking-widest text-secondary opacity-40">Type:</Typography>
                            <Stack direction="horizontal" gap="xs">
                                {["ALL", "JOBB", "LIA", "UPPDRAG"].map((t) => (
                                    <Button
                                        key={t}
                                        variant={typeFilter === t ? "primary" : "ghost"}
                                        size="sm"
                                        onClick={() => setTypeFilter(t)}
                                        style={{ fontSize: '11px', textTransform: 'lowercase' }}
                                    >
                                        {t.toLowerCase()}
                                    </Button>
                                ))}
                            </Stack>
                        </Stack>

                        <Stack direction="horizontal" gap="md" align="center">
                            <Typography variant="caption" style={{ fontWeight: 'bold' }} className="uppercase tracking-widest text-secondary opacity-40">Location:</Typography>
                            <Stack direction="horizontal" gap="xs">
                                {["ALL", "REMOTE", "HYBRID", "ONSITE"].map((l) => (
                                    <Button
                                        key={l}
                                        variant={locationFilter === l ? "primary" : "ghost"}
                                        size="sm"
                                        onClick={() => setLocationFilter(l)}
                                        style={{ fontSize: '11px', textTransform: 'lowercase' }}
                                    >
                                        {l.toLowerCase()}
                                    </Button>
                                ))}
                            </Stack>
                        </Stack>
                    </Stack>
                </Stack>
            </Card>

            {/* CONTENT GRID */}
            {filtered.length === 0 ? (
                <Box style={{ textAlign: 'center', padding: 'var(--space-2xl) 0', opacity: 0.5 }}>
                    <Zap size={32} style={{ margin: '0 auto 16px', strokeWidth: 1 }} />
                    <Typography variant="h3">It's quiet on the board</Typography>
                    <Typography variant="caption">Try adjusting your filters or share something with the community.</Typography>
                </Box>
            ) : (
                <Grid gap="md">
                    {filtered.map((opportunity) => (
                        <GridItem key={opportunity.id} span={{ base: 12, md: 6, lg: 4 }}>
                            <OpportunityCard opportunity={opportunity} currentUserName={currentUserName} />
                        </GridItem>
                    ))}
                </Grid>
            )}
        </Stack>
    );
}
