"use client";

import React from "react";

export function Skeleton({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={`animate-pulse bg-white/5 rounded-md ${className}`}
            {...props}
        />
    );
}

export function CardSkeleton() {
    return (
        <div className="feed-card p-5 space-y-4">
            <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-md" />
                <div className="space-y-2">
                    <Skeleton className="w-24 h-3" />
                    <Skeleton className="w-16 h-2" />
                </div>
            </div>
            <div className="space-y-2">
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-5/6 h-4" />
                <Skeleton className="w-4/6 h-4" />
            </div>
            <div className="flex gap-4 pt-4 border-t border-white/5">
                <Skeleton className="w-12 h-6" />
                <Skeleton className="w-12 h-6" />
                <Skeleton className="w-12 h-6" />
            </div>
        </div>
    );
}

export function Spinner({ className = "", size = "md" }: { className?: string, size?: "sm" | "md" | "lg" }) {
    const sizeClasses = {
        sm: "w-4 h-4 border-2",
        md: "w-6 h-6 border-2",
        lg: "w-8 h-8 border-3",
    };

    return (
        <div
            className={`animate-spin rounded-full border-t-neon-green border-white/10 ${sizeClasses[size]} ${className}`}
        />
    );
}

export function LoadingDots() {
    return (
        <div className="flex gap-1 items-center">
            <div className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1 h-1 rounded-full bg-current animate-bounce"></div>
        </div>
    );
}
