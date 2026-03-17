"use client";

import FeedComposer from "./feed-composer";
import FeedPostCard from "./feed-post-card";
import { Stack } from "@/components/layout/Stack";
import { EmptyState } from "@/components/ui/EmptyState";
import { Share2 } from "lucide-react";

interface User {
    id: string;
    name: string;
}

interface FeedPost {
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; name: string };
    attachments: any[];
    reactions: { type: string; userId: string }[];
    _count: { comments: number };
}

interface Props {
    initialPosts: FeedPost[];
    currentUser: User;
}

export default function FeedView({ initialPosts, currentUser }: Props) {
    return (
        <Stack gap={32} style={{ maxWidth: "680px" }}>
            <FeedComposer user={currentUser} />

            <Stack gap={24}>
                {initialPosts.length === 0 ? (
                    <EmptyState
                        icon={Share2}
                        title="Tyst i flödet"
                        description="Bli den första att dela något med communityt."
                    />
                ) : (
                    initialPosts.map((post) => (
                        <FeedPostCard key={post.id} post={post} currentUserId={currentUser.id} currentUserName={currentUser.name} />
                    ))
                )}
            </Stack>
        </Stack>
    );
}
