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
    currentUser: User;
}

export default function FeedView({ initialPosts, currentUser }: Props) {
    return (
        <div className="max-w-2xl mx-auto py-8">
            <div className="mb-10 px-4">
                <h1 className="text-3xl font-bold text-bright mb-2 italic tracking-tight">insikter</h1>
                <p className="text-sm text-secondary leading-relaxed">dela tankar, länkar och erfarenheter med dina kollegor i ett samarbetsfokuserat flöde.</p>
            </div>

            <FeedComposer user={currentUser} />

            <div className="space-y-6">
                {initialPosts.length === 0 ? (
                    <div className="empty-state py-20 card border-dashed">
                        <div className="empty-state-icon text-muted/30">░</div>
                        <div className="empty-state-title">tyst i flödet</div>
                        <div className="empty-state-text">bli den första att dela något med communityt.</div>
                    </div>
                ) : (
                    initialPosts.map((post) => (
                        <FeedPostCard key={post.id} post={post} currentUserId={currentUser.id} currentUserName={currentUser.name} />
                    ))
                )}
            </div>
        </div>
    );
}
