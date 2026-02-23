import { Skeleton } from "@/components/ui/skeleton";

export default function FeedLoading() {
    return (
        <div className="content-area">
            <div className="max-w-2xl mx-auto py-8">
                <div className="mb-10 px-4">
                    <Skeleton className="h-10 w-48 mb-2" variant="neon" />
                    <Skeleton className="h-4 w-full opacity-60" />
                    <Skeleton className="h-4 w-3/4 opacity-60 mt-1" />
                </div>

                {/* Composer Skeleton */}
                <div className="card card-compact mb-8 p-4">
                    <div className="row">
                        <Skeleton className="h-10 w-10 rounded-sm" />
                        <Skeleton className="h-10 flex-1 rounded-full" />
                    </div>
                </div>

                {/* Posts Skeleton */}
                <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="card p-4 space-y-4">
                            <div className="row">
                                <Skeleton className="h-10 w-10 rounded-sm" />
                                <div className="space-y-1 flex-1">
                                    <Skeleton className="h-4 w-32" variant="neon" />
                                    <Skeleton className="h-3 w-20 opacity-50" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-11/12" />
                                <Skeleton className="h-4 w-4/5" />
                            </div>
                            <div className="row pt-2">
                                <Skeleton className="h-8 w-16 rounded-sm" />
                                <Skeleton className="h-8 w-16 rounded-sm" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
