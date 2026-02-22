"use client";

import LinkPreview from "./link-preview";

interface Props {
    content: string;
}

export default function MessageContent({ content }: Props) {
    // Regex for basic URL detection
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    const urls = content.match(urlRegex) || [];

    return (
        <div className="message-content-wrapper">
            <div className="chat-message-content">
                {parts.map((part, i) => {
                    if (part.match(urlRegex)) {
                        return (
                            <a
                                key={i}
                                href={part}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent hover:underline"
                                style={{ color: "var(--accent-color)" }}
                            >
                                {part}
                            </a>
                        );
                    }
                    return <span key={i}>{part}</span>;
                })}
            </div>
            {urls.length > 0 && (
                <div className="link-previews-container stack mt-1" style={{ gap: "var(--space-2)" }}>
                    {urls.map((url, i) => (
                        <LinkPreview key={i} url={url} />
                    ))}
                </div>
            )}
        </div>
    );
}
