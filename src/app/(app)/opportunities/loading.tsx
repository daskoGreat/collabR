import { Skeleton } from "@/components/ui/skeleton";

export default function OpportunitiesLoading() {
    return (
        <div className="content-area">
            <div className="mb-10">
                <Skeleton className="h-10 w-64 mb-2" variant="neon" />
                <Skeleton className="h-4 w-96 opacity-60" />
            </div>

            {/* Filter Skeleton */}
            <div className="card card-compact mb-8 p-4">
                <div className="row">
                    <Skeleton className="h-10 flex-1 rounded-sm" />
                    <Skeleton className="h-10 w-32 rounded-sm" />
                    <Skeleton className="h-10 w-40 rounded-sm" />
                </div>
            </div>

            {/* Grid Skeleton */}
            <div className="grid-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="card p-5 space-y-4">
                        <div className="row-between">
                            <Skeleton className="h-4 w-16 rounded-sm opacity-50" />
                            <Skeleton className="h-4 w-24 rounded-sm opacity-50" />
                        </div>
                        <Skeleton className="h-6 w-3/4" variant="neon" />
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-5/6" />
                        </div>
                        <div className="pt-4 mt-auto border-t border-subtle">
                            <div className="row-between">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
