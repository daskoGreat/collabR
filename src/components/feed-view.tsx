"use client";

import FeedComposer from "./feed-composer";
import FeedPostCard from "./feed-post-card";

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
    currentUserId: string;
}

export default function FeedView({ initialPosts, currentUserId }: Props) {
    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-bright mb-1 italic">insikter</h1>
                <p className="text-sm text-muted">dela tankar, länkar och erfarenheter med dina kollegor.</p>
            </div>

            <FeedComposer />

            <div className="flex flex-col">
                {initialPosts.length === 0 ? (
                    <div className="empty-state py-20">
                        <div className="empty-state-icon">░</div>
                        <div className="empty-state-title">tyst i flödet</div>
                        <div className="empty-state-text">bli den första att dela något med communityt.</div>
                    </div>
                ) : (
                    initialPosts.map((post) => (
                        <FeedPostCard key={post.id} post={post} currentUserId={currentUserId} />
                    ))
                )}
            </div>
        </div>
    );
}
