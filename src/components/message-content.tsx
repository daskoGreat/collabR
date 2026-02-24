"use client";

import LinkPreview from "./link-preview";

interface Props {
    content: string;
    currentUserName?: string;
}

export default function MessageContent({ content, currentUserName }: Props) {
    // Regex for basic URL detection
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const mentionRegex = /(@[\w\s.ÅÄÖåäö]+?)(?=\s|$|[,.!?])/g;

    // Split by both URLs and Mentions
    const combinedRegex = /((?:https?:\/\/[^\s]+)|(?:@[\w\s.ÅÄÖåäö]+?)(?=\s|$|[,.!?]))/g;
    const parts = content.split(combinedRegex);
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
                    if (part.match(mentionRegex)) {
                        const isMe = currentUserName && part.toLowerCase() === `@${currentUserName.toLowerCase()}`;
                        return (
                            <span key={i} className={isMe ? "mention-token-me" : "mention-token"}>
                                {part}
                            </span>
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
