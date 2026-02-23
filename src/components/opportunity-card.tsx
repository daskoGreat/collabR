"use client";

import { format } from "date-fns";
import Link from "next/link";

interface Opportunity {
    id: string;
    title: string;
    content: string;
    type: "JOBB" | "LIA" | "UPPDRAG";
    location: "REMOTE" | "HYBRID" | "ONSITE";
    tags: string[];
    deadline: string | null;
    user: { name: string };
    _count?: { comments: number };
}

interface Props {
    opportunity: Opportunity;
}

import { MapPin, Clock } from "lucide-react";

export default function OpportunityCard({ opportunity }: Props) {
    const typeLabel = opportunity.type.toLowerCase();
    const locationLabel = opportunity.location.toLowerCase();

    // Truncate content for the card
    const truncatedContent = opportunity.content.length > 150
        ? opportunity.content.slice(0, 150) + "..."
        : opportunity.content;

    return (
        <Link href={`/opportunities/${opportunity.id}`} className="card card-hover opportunity-card no-underline">
            <div className="row-between mb-2">
                <span className={`badge badge-type status-${typeLabel}`}>
                    {typeLabel}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted">
                    <MapPin size={12} strokeWidth={1.5} />
                    {locationLabel}
                </span>
            </div>

            <h3 className="text-lg font-bold text-primary mb-2 line-clamp-1">
                {opportunity.title}
            </h3>

            <p className="text-sm text-secondary mb-4 line-clamp-3">
                {truncatedContent}
            </p>

            <div className="mt-auto">
                <div className="flex flex-wrap gap-1 mb-3">
                    {opportunity.tags.map((tag) => (
                        <span key={tag} className="tag tag-sm">
                            {tag}
                        </span>
                    ))}
                </div>

                <div className="row-between text-xs text-muted pt-2 border-t border-subtle">
                    <span>av {opportunity.user.name}</span>
                    {opportunity.deadline && (
                        <span className="flex items-center gap-1">
                            <Clock size={12} strokeWidth={1.5} />
                            {format(new Date(opportunity.deadline), "MMM d")}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
