"use client";

import { format } from "date-fns";
import { sv } from "date-fns/locale";
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
    currentUserName?: string;
}

import { MapPin, Clock } from "lucide-react";

import MessageContent from "./message-content";

export default function OpportunityCard({ opportunity, currentUserName }: Props) {
    const typeLabel = opportunity.type.toLowerCase();
    const locationLabel = opportunity.location.toLowerCase();

    // Truncate content for the card
    const truncatedContent = opportunity.content.length > 200
        ? opportunity.content.slice(0, 200) + "..."
        : opportunity.content;

    const isMentioned = currentUserName && opportunity.content.toLowerCase().includes(`@${currentUserName.toLowerCase()}`);

    return (
        <Link href={`/opportunities/${opportunity.id}`} className={`card card-hover opportunity-card no-underline group transition-all duration-300 ${isMentioned ? "chat-message-mentioned" : ""}`}>
            <div className="row-between mb-4">
                <span className={`badge badge-type status-${typeLabel} font-mono uppercase tracking-tighter`}>
                    {typeLabel}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-muted font-mono uppercase tracking-wider">
                    <MapPin size={12} strokeWidth={1.5} className="opacity-50" />
                    {locationLabel}
                </span>
            </div>

            <h3 className="text-xl font-bold text-bright mb-3 line-clamp-1 group-hover:text-primary transition-colors">
                {opportunity.title}
            </h3>

            <div className="text-sm text-secondary mb-6 leading-relaxed">
                <MessageContent content={truncatedContent} currentUserName={currentUserName} />
            </div>

            <div className="mt-auto">
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {opportunity.tags.map((tag) => (
                        <span key={tag} className="tag tag-sm bg-primary/5 text-primary/80 border-primary/20">
                            {tag}
                        </span>
                    ))}
                </div>

                <div className="row-between text-[10px] text-muted pt-3 border-t border-subtle font-mono uppercase tracking-widest">
                    <span className="opacity-70">av {opportunity.user.name.toLowerCase()}</span>
                    {opportunity.deadline && (
                        <span className="flex items-center gap-1.5 opacity-70">
                            <Clock size={12} strokeWidth={1.5} />
                            {format(new Date(opportunity.deadline), "MMM d", { locale: sv })}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
