"use client";

import { useState, useRef } from "react";
import BackButton from "@/components/back-button";

interface FileItem {
    id: string;
    name: string;
    size: number;
    mimeType: string;
    url: string;
    uploadedBy: string;
    createdAt: string;
}

interface Props {
    spaceId: string;
    files: FileItem[];
    currentUserId: string;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilesView({ spaceId, files }: Props) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError("");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("spaceId", spaceId);

        try {
            const res = await fetch("/api/files/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "upload failed");
            } else {
                window.location.reload();
            }
        } catch {
            setError("upload failed. try again.");
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    }

    return (
        <div className="content-area">
            <div className="mb-4">
                <BackButton />
            </div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">files</h1>
                    <p className="page-subtitle">shared files for this space</p>
                </div>
                <div>
                    <input
                        ref={fileRef}
                        type="file"
                        onChange={handleUpload}
                        style={{ display: "none" }}
                        id="file-upload"
                    />
                    <button
                        className="btn btn-primary"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                    >
                        {uploading ? "uploading..." : "+ upload file"}
                    </button>
                </div>
            </div>

            {error && <div className="error-text mb-4">{error}</div>}

            {files.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">⊞</div>
                    <div className="empty-state-title">no files yet</div>
                    <div className="empty-state-text">
                        upload docs, configs, screenshots — whatever helps.
                    </div>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>name</th>
                                <th>size</th>
                                <th>type</th>
                                <th>uploaded by</th>
                                <th>date</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {files.map((file) => (
                                <tr key={file.id}>
                                    <td className="font-semibold">{file.name}</td>
                                    <td>{formatSize(file.size)}</td>
                                    <td>
                                        <span className="tag">{file.mimeType.split("/")[1] || file.mimeType}</span>
                                    </td>
                                    <td>{file.uploadedBy}</td>
                                    <td className="text-muted">
                                        {new Date(file.createdAt).toLocaleDateString("sv-SE")}
                                    </td>
                                    <td>
                                        <a
                                            href={file.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-ghost btn-sm"
                                        >
                                            ↓ download
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
