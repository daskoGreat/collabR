import { Skeleton, CardSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <>
            <div className="topbar">
                <div className="row" style={{ gap: "var(--space-4)" }}>
                    <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
                    <Skeleton className="w-48 h-6" variant="neon" />
                </div>
            </div>
            <div className="content-area">
                <Skeleton className="w-3/4 h-4 mb-8 opacity-50" />

                <div className="stats-grid mb-10">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="card stat-card">
                            <Skeleton className="w-12 h-8 mb-2" />
                            <Skeleton className="w-16 h-3 opacity-30" />
                        </div>
                    ))}
                </div>

                <div className="grid-2">
                    <div className="card p-6">
                        <Skeleton className="w-32 h-5 mb-6" />
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="w-full h-12" />
                            ))}
                        </div>
                    </div>
                    <div>
                        <Skeleton className="w-24 h-5 mb-4" />
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map(i => (
                                <Skeleton key={i} className="w-full h-14" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
