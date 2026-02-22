"use client";

import { useState, useRef } from "react";

interface Props {
    onUploadSuccess: (url: string, file: File) => void;
    onUploadError: (error: string) => void;
    spaceId: string;
}

export default function AttachmentPicker({ onUploadSuccess, onUploadError, spaceId }: Props) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        await uploadFile(file);
    }

    async function uploadFile(file: File) {
        setUploading(true);
        setProgress(10);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("spaceId", spaceId);

        try {
            // Minimal progress simulation since fetch doesn't support upload progress easily without XHR
            const progressInterval = setInterval(() => {
                setProgress(prev => (prev < 90 ? prev + 10 : prev));
            }, 200);

            const res = await fetch("/api/files/upload", {
                method: "POST",
                body: formData,
            });

            clearInterval(progressInterval);
            setProgress(100);

            if (res.ok) {
                const data = await res.json();
                onUploadSuccess(data.url, file);
            } else {
                const data = await res.json();
                onUploadError(data.error || "Uppladdning misslyckades");
            }
        } catch (err) {
            onUploadError("Kunde inte ansluta till servern");
        } finally {
            setUploading(false);
            setProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    return (
        <div className="attachment-picker">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: "none" }}
            />
            <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Bifoga fil"
                style={{ fontSize: "1.1rem" }}
            >
                📎
            </button>

            {uploading && (
                <div
                    style={{
                        position: "absolute",
                        bottom: "100%",
                        left: 0,
                        right: 0,
                        height: "2px",
                        background: "var(--bg-glass)",
                        marginBottom: "var(--space-2)"
                    }}
                >
                    <div
                        style={{
                            height: "100%",
                            width: `${progress}%`,
                            background: "var(--neon-green)",
                            transition: "width 0.2s ease"
                        }}
                    />
                </div>
            )}
        </div>
    );
}
