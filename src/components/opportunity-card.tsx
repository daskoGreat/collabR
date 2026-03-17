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
import { Card } from "@/components/ui/card";
import { Stack } from "@/components/layout/Stack";
import { Typography } from "@/components/ui/typography";
import { Box } from "@/components/layout/Box";

export default function OpportunityCard({ opportunity, currentUserName }: Props) {
    const typeLabel = opportunity.type.toLowerCase();
    const locationLabel = opportunity.location.toLowerCase();

    // Truncate content for the card
    const truncatedContent = opportunity.content.length > 160
        ? opportunity.content.slice(0, 160) + "..."
        : opportunity.content;

    const isMentioned = currentUserName && opportunity.content.toLowerCase().includes(`@${currentUserName.toLowerCase()}`);

    return (
        <Link href={`/opportunities/${opportunity.id}`} className="block group">
            <Card className={`h-full ${isMentioned ? 'border-primary' : ''}`}>
                <Stack direction="vertical" gap="md" style={{ height: '100%' }}>
                    <Stack direction="horizontal" justify="between" align="center">
                        <Box style={{
                            background: 'var(--bg-tertiary)',
                            padding: 'var(--space-xs) var(--space-sm)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)'
                        }}>
                            <Typography variant="caption" style={{ fontWeight: 'bold' }} className="uppercase tracking-tighter">
                                {typeLabel}
                            </Typography>
                        </Box>
                        <Stack direction="horizontal" gap="xs" align="center">
                            <MapPin size={10} className="text-secondary opacity-40" />
                            <Typography variant="caption" className="text-secondary opacity-40 uppercase tracking-widest">
                                {locationLabel}
                            </Typography>
                        </Stack>
                    </Stack>

                    <Stack direction="vertical" gap="xs">
                        <Typography variant="h3" className="group-hover:text-primary transition-colors">
                            {opportunity.title.toLowerCase()}
                        </Typography>
                        <Box style={{ opacity: 0.7, minHeight: '60px' }}>
                            <MessageContent content={truncatedContent} currentUserName={currentUserName} />
                        </Box>
                    </Stack>

                    <Box style={{ marginTop: 'auto', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border-subtle)' }}>
                        <Stack direction="horizontal" justify="between" align="center">
                            <Typography variant="caption" className="text-secondary italic">
                                by {opportunity.user.name.toLowerCase()}
                            </Typography>
                            {opportunity.deadline && (
                                <Stack direction="horizontal" gap="xs" align="center">
                                    <Clock size={10} className="text-secondary opacity-40" />
                                    <Typography variant="caption" className="text-secondary opacity-40">
                                        {format(new Date(opportunity.deadline), "MMM d", { locale: sv })}
                                    </Typography>
                                </Stack>
                            )}
                        </Stack>
                    </Box>
                </Stack>
            </Card>
        </Link>
    );
}
