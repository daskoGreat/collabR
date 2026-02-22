"use client";

import { useEffect, useState } from "react";

interface PreviewData {
    title: string;
    description: string;
    image: string;
    domain: string;
    url: string;
}

interface Props {
    url: string;
}

export default function LinkPreview({ url }: Props) {
    const [preview, setPreview] = useState<PreviewData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPreview = async () => {
            try {
                const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
                if (res.ok) {
                    const data = await res.json();
                    setPreview(data);
                }
            } catch (err) {
                console.error("Failed to load link preview:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPreview();
    }, [url]);

    if (loading) return null;
    if (!preview || (!preview.title && !preview.description)) return null;

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="link-preview-card card card-compact mt-2 no-underline hover:border-accent group"
            style={{
                display: "flex",
                flexDirection: "row",
                gap: "var(--space-3)",
                maxWidth: "500px",
                textDecoration: "none",
                color: "inherit"
            }}
        >
            {preview.image && (
                <div style={{ width: "100px", height: "100px", flexShrink: 0, overflow: "hidden" }}>
                    <img
                        src={preview.image}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                </div>
            )}
            <div style={{ flex: 1, minWidth: 0, padding: "var(--space-2)" }}>
                <div className="text-xs text-muted mb-1 uppercase tracking-wider">{preview.domain}</div>
                <div className="text-sm font-semibold truncate group-hover:text-accent" style={{ color: "var(--text-primary)" }}>
                    {preview.title}
                </div>
                {preview.description && (
                    <div className="text-xs text-secondary mt-1 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                        {preview.description}
                    </div>
                )}
            </div>
        </a>
    );
}
