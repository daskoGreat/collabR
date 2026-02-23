import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <>
            <div className="topbar">
                <div className="row" style={{ gap: "var(--space-4)" }}>
                    <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
                    <div className="flex items-baseline gap-2">
                        <Skeleton className="w-24 h-4 opacity-50" />
                        <Skeleton className="w-32 h-6" variant="neon" />
                    </div>
                </div>
            </div>
            <div className="chat-container">
                <div className="chat-messages p-6 space-y-8">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`flex gap-4 ${i % 2 === 0 ? "flex-row-reverse" : ""}`}>
                            <Skeleton className="w-10 h-10 rounded-sm shrink-0" />
                            <div className={`space-y-2 max-w-[70%] ${i % 2 === 0 ? "items-end flex flex-col" : ""}`}>
                                <div className="flex gap-2 items-center">
                                    <Skeleton className="w-20 h-3" />
                                    <Skeleton className="w-12 h-2 opacity-30" />
                                </div>
                                <Skeleton className={`h-16 ${i % 2 === 0 ? "w-64" : "w-80"}`} />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="chat-input-area border-t border-subtle p-4">
                    <Skeleton className="w-full h-12 rounded-md" />
                </div>
            </div>
        </>
    );
}
