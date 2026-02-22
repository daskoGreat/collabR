"use client";

import { useState } from "react";
import OpportunityCard from "./opportunity-card";
import { createOpportunity } from "@/lib/actions/opportunities";
import AttachmentPicker from "./attachment-picker";
import AttachmentList from "./attachment-list";

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
}

export default function OpportunityBoard({ initialOpportunities }: Props) {
    const [opportunities, setOpportunities] = useState(initialOpportunities);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("ALL");
    const [locationFilter, setLocationFilter] = useState<string>("ALL");
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [pendingAttachments, setPendingAttachments] = useState<{ url: string; name: string; mimeType: string; size: number }[]>([]);

    const filtered = opportunities.filter((o) => {
        const matchesSearch = o.title.toLowerCase().includes(search.toLowerCase()) ||
            o.content.toLowerCase().includes(search.toLowerCase()) ||
            o.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
        const matchesType = typeFilter === "ALL" || o.type === typeFilter;
        const matchesLocation = locationFilter === "ALL" || o.location === locationFilter;
        return matchesSearch && matchesType && matchesLocation;
    });

    async function handleCreate(formData: FormData) {
        setCreating(true);
        if (pendingAttachments.length > 0) {
            formData.append("attachments", JSON.stringify(pendingAttachments));
        }
        const res = await createOpportunity(formData);
        setCreating(false);
        if (res?.success) {
            setShowCreate(false);
            setPendingAttachments([]);
            // In a real app, we'd probably re-fetch or use Pusher to update the list
            // For now, we'll rely on the user refreshing or revalidatePath if it's a server component
            window.location.reload();
        }
    }

    return (
        <div className="content-area">
            <div className="page-header">
                <div>
                    <h1 className="page-title">jobb & möjligheter</h1>
                    <p className="page-subtitle">hitta ditt nästa äventyr eller dela en öppning</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
                    + dela möjlighet
                </button>
            </div>

            {showCreate && (
                <div className="card mb-8">
                    <div className="modal-title">ny post</div>
                    <form className="auth-form" action={handleCreate}>
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
                            <textarea name="content" className="input" rows={6} placeholder="berätta mer om rollen, krav och vad ni erbjuder..." required />
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
                            <button type="submit" className="btn btn-primary" disabled={creating}>
                                {creating ? "publicerar..." : "publicera möjlighet"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="mb-6 flex flex-col gap-4">
                <input
                    type="text"
                    className="input w-full"
                    placeholder="sök bland jobb, LIA och uppdrag..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

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
                    <div className="empty-state-icon">✧</div>
                    <div className="empty-state-title">the board is quiet</div>
                    <div className="empty-state-text">
                        if you know of an open door or a teammate in need, be the first to share it with the community.
                    </div>
                </div>
            ) : (
                <div className="opportunities-grid">
                    {filtered.map((opportunity) => (
                        <OpportunityCard key={opportunity.id} opportunity={opportunity} />
                    ))}
                </div>
            )}
        </div>
    );
}
