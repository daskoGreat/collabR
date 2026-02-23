"use client";

import { Loader2 } from "lucide-react";

export function LoadingSpinner({ size = "md", className = "" }: { size?: "sm" | "md" | "lg" | number, className?: string }) {
    const sizeMap = {
        sm: 16,
        md: 24,
        lg: 32,
    };

    const pixelSize = typeof size === "number" ? size : sizeMap[size];

    return (
        <Loader2
            size={pixelSize}
            className={`animate-spin text-neon-green ${className}`}
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
