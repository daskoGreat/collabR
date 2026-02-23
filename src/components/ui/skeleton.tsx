"use client";
interface Props {
    className?: string;
    variant?: "default" | "neon";
}

export function Skeleton({ className = "", variant = "default" }: Props) {
    return (
        <div
            className={`skeleton ${variant === "neon" ? "skeleton-neon" : ""} ${className}`}
        />
    );
}

export function CardSkeleton() {
    return (
        <div className="card p-5 space-y-4">
            <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-sm" />
                <div className="space-y-2">
                    <Skeleton className="w-24 h-3" variant="neon" />
                    <Skeleton className="w-16 h-2 opacity-50" />
                </div>
            </div>
            <div className="space-y-2">
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-11/12 h-4" />
            </div>
            <div className="flex gap-4 pt-4 border-t border-subtle">
                <Skeleton className="w-12 h-6" />
                <Skeleton className="w-12 h-6" />
            </div>
        </div>
    );
}
