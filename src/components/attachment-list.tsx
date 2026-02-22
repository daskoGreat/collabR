"use client";

interface Attachment {
    id?: string;
    url: string;
    name: string;
    mimeType: string;
    size?: number;
}

interface Props {
    attachments: Attachment[];
    onRemove?: (url: string) => void;
    readOnly?: boolean;
}

export default function AttachmentList({ attachments, onRemove, readOnly = false }: Props) {
    if (attachments.length === 0) return null;

    const isImage = (mime: string) => mime.startsWith("image/");

    const getProxiedUrl = (url: string) => {
        if (url.includes("blob.vercel-storage.com")) {
            return `/api/files/view?url=${encodeURIComponent(url)}`;
        }
        return url;
    };

    return (
        <div className="attachment-list mt-2 stack" style={{ gap: "var(--space-2)" }}>
            {attachments.map((file, i) => (
                <div key={file.id || i} className="attachment-item row" style={{ alignItems: "flex-start" }}>
                    {isImage(file.mimeType) ? (
                        <div className="attachment-preview card card-compact" style={{ padding: 0, overflow: "hidden", maxWidth: "300px" }}>
                            <img
                                src={getProxiedUrl(file.url)}
                                alt={file.name}
                                style={{ width: "100%", height: "auto", display: "block" }}
                            />
                            {!readOnly && (
                                <button
                                    className="btn btn-danger btn-sm"
                                    style={{ position: "absolute", top: 4, right: 4, padding: "2px 6px" }}
                                    onClick={() => onRemove?.(file.url)}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="card card-compact row" style={{ flex: 1, gap: "var(--space-3)" }}>
                            <div className="text-xl">📄</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="text-sm font-semibold truncate">{file.name}</div>
                                {file.size && (
                                    <div className="text-xs text-muted">{(file.size / 1024).toFixed(1)} KB</div>
                                )}
                            </div>
                            <a
                                href={getProxiedUrl(file.url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-ghost btn-sm"
                                title="Ladda ner"
                            >
                                ⬇
                            </a>
                            {!readOnly && (
                                <button
                                    className="btn btn-ghost btn-sm text-danger"
                                    onClick={() => onRemove?.(file.url)}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
