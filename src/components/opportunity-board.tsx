"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import MentionList from "./mention-list";
import OpportunityCard from "./opportunity-card";
import { createOpportunity } from "@/lib/actions/opportunities";
import AttachmentPicker from "./attachment-picker";
import AttachmentList from "./attachment-list";
import { LoadingSpinner } from "./ui/loading-spinner";

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

import { PlusSquare, Zap } from "lucide-react";

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
            alert("Kunde inte skapa möjlighet");
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
        <div className="content-area">
            <div className="page-header">
                <div>
                    <h1 className="page-title">jobb & möjligheter</h1>
                    <p className="page-subtitle">hitta ditt nästa äventyr eller dela en öppning</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
                    <PlusSquare size={18} strokeWidth={1.5} className="mr-2" />
                    <span>dela möjlighet</span>
                </button>
            </div>

            {showCreate && (
                <div className="card mb-8">
                    <div className="modal-title">ny post</div>
                    <form className="auth-form" onSubmit={handleCreate}>
                        <div className="form-group">
                            <label className="form-label">rubrik</label>
                            <input type="text" name="title" className="input" placeholder="t.ex. Senior Frontend Utvecklare" required />
                        </div>

                        <div className="row">
                            <div className="form-group flex-1">
                                <label className="form-label">typ</label>
                                <select name="type" className="select w-full">
                                    <option value="JOBB">jobb</option>
                                    <option value="LIA">lia</option>
                                    <option value="UPPDRAG">uppdrag</option>
                                </select>
                            </div>
                            <div className="form-group flex-1">
                                <label className="form-label">plats</label>
                                <select name="location" className="select w-full">
                                    <option value="REMOTE">remote</option>
                                    <option value="HYBRID">hybrid</option>
                                    <option value="ONSITE">onsite</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">beskrivning</label>
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
                                    name="content"
                                    className="input"
                                    rows={6}
                                    placeholder="berätta mer om rollen, krav och vad ni erbjuder..."
                                    required
                                    value={content}
                                    onChange={(e) => handleInputChange(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>
                        </div>

                        <div className="row">
                            <div className="form-group flex-1">
                                <label className="form-label">tags (komma-separerade)</label>
                                <input type="text" name="tags" className="input" placeholder="react, typescript, design" />
                            </div>
                            <div className="form-group flex-1">
                                <label className="form-label">länk (valfritt)</label>
                                <input type="url" name="link" className="input" placeholder="https://..." />
                            </div>
                        </div>

                        <div className="row">
                            <div className="form-group flex-1">
                                <label className="form-label">kontaktinfo (valfritt)</label>
                                <input type="text" name="contactInfo" className="input" placeholder="e-post, telefon..." />
                            </div>
                            <div className="form-group flex-1">
                                <label className="form-label">deadline (valfritt)</label>
                                <input type="date" name="deadline" className="input" />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">bilagor</label>
                            <div className="mb-2">
                                <AttachmentPicker
                                    onUploadSuccess={(url, file) => setPendingAttachments([...pendingAttachments, { url, name: file.name, mimeType: file.type, size: file.size }])}
                                    onUploadError={(err) => alert(err)}
                                    spaceId="opportunities"
                                />
                            </div>
                            <AttachmentList
                                attachments={pendingAttachments}
                                onRemove={(url) => setPendingAttachments(pendingAttachments.filter(a => a.url !== url))}
                            />
                        </div>

                        <div className="modal-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                                avbryt
                            </button>
                            <button type="submit" className="btn btn-primary min-w-[140px]" disabled={creating || isPending}>
                                {creating || isPending ? (
                                    <div className="flex items-center gap-2">
                                        <LoadingSpinner size="sm" />
                                        <span>publicerar...</span>
                                    </div>
                                ) : "publicera möjlighet"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="mb-6 flex flex-col gap-4">
                <div className="relative">
                    <input
                        type="text"
                        className="input w-full pr-10"
                        placeholder="sök bland jobb, LIA och uppdrag..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 animate-pulse text-[10px] font-mono pointer-events-none">
                            SÖKER...
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-6 items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted uppercase font-bold">Typ:</span>
                        <div className="tabs tabs-sm">
                            {["ALL", "JOBB", "LIA", "UPPDRAG"].map((t) => (
                                <button
                                    key={t}
                                    className={`tab ${typeFilter === t ? "active" : ""}`}
                                    onClick={() => setTypeFilter(t)}
                                >
                                    {t.toLowerCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted uppercase font-bold">Plats:</span>
                        <div className="tabs tabs-sm">
                            {["ALL", "REMOTE", "HYBRID", "ONSITE"].map((l) => (
                                <button
                                    key={l}
                                    className={`tab ${locationFilter === l ? "active" : ""}`}
                                    onClick={() => setLocationFilter(l)}
                                >
                                    {l.toLowerCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <Zap size={32} strokeWidth={1} />
                    </div>
                    <div className="empty-state-title">det är tyst på tavlan</div>
                    <div className="empty-state-text">
                        hittar du en tillgänglig roll eller ett uppdrag? dela gärna med dig till communityt.
                    </div>
                </div>
            ) : (
                <div className="opportunities-grid">
                    {filtered.map((opportunity) => (
                        <OpportunityCard key={opportunity.id} opportunity={opportunity} currentUserName={currentUserName} />
                    ))}
                </div>
            )}
        </div>
    );
}
