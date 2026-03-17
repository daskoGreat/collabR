"use client";

import { Box } from "@/components/layout/Box";

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string;
    className?: string;
    style?: React.CSSProperties;
}

export function Skeleton({
    width = "100%",
    height = "20px",
    borderRadius = "8px",
    className = "",
    style = {}
}: SkeletonProps) {
    return (
        <Box
            className={`skeleton-pulse ${className}`}
            style={{
                width,
                height,
                borderRadius,
                background: "rgba(255,255,255,0.05)",
                position: "relative",
                overflow: "hidden",
                ...style
            }}
        >
            <style dangerouslySetInnerHTML={{
                __html: `
                .skeleton-pulse {
                    animation: skeleton-load 1.5s infinite linear;
                }
                .skeleton-pulse::after {
                    content: "";
                    position: absolute;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    left: 0;
                    transform: translateX(-100%);
                    background-image: linear-gradient(
                        90deg,
                        rgba(255, 255, 255, 0) 0,
                        rgba(255, 255, 255, 0.03) 20%,
                        rgba(255, 255, 255, 0.05) 60%,
                        rgba(255, 255, 255, 0)
                    );
                    animation: shimmer 2s infinite;
                }
                @keyframes skeleton-load {
                    0% { opacity: 0.5; }
                    50% { opacity: 0.8; }
                    100% { opacity: 0.5; }
                }
                @keyframes shimmer {
                    100% {
                        transform: translateX(100%);
                    }
                }
            `}} />
        </Box>
    );
}

export function CardSkeleton() {
    return (
        <Box style={{
            background: "rgba(255,255,255,0.02)",
            borderRadius: "24px",
            padding: "2rem",
            border: "1px solid rgba(255,255,255,0.05)",
            marginBottom: "1rem"
        }}>
            <Skeleton width="40%" height="24px" style={{ marginBottom: "1rem" }} />
            <Skeleton width="100%" height="16px" style={{ marginBottom: "0.5rem" }} />
            <Skeleton width="90%" height="16px" style={{ marginBottom: "1.5rem" }} />
            <Box style={{ display: "flex", gap: "12px" }}>
                <Skeleton width="80px" height="32px" borderRadius="99px" />
                <Skeleton width="80px" height="32px" borderRadius="99px" />
            </Box>
        </Box>
    );
}
