"use client";

import { useEffect, useRef, useState } from "react";
import { getPusherClient } from "@/lib/pusher-client";

interface Message {
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; name: string };
}

interface Props {
    channel: { id: string; name: string; spaceName: string };
    initialMessages: Message[];
    currentUser: { id: string; name: string };
    spaceId: string;
}

export default function ChatView({
    channel,
    initialMessages,
    currentUser,
    spaceId,
}: Props) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Subscribe to Pusher for realtime messages
    useEffect(() => {
        try {
            const pusher = getPusherClient();
            const channelSub = pusher.subscribe(`channel-${channel.id}`);
            channelSub.bind("new-message", (data: Message) => {
                setMessages((prev) => [...prev, data]);
            });
            return () => {
                channelSub.unbind_all();
                pusher.unsubscribe(`channel-${channel.id}`);
            };
        } catch {
            // Pusher not configured, graceful fallback
            return;
        }
    }, [channel.id]);

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!input.trim() || sending) return;

        setSending(true);
        const content = input.trim();
        setInput("");

        try {
            const res = await fetch("/api/chat/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ channelId: channel.id, spaceId, content }),
            });

            if (!res.ok) {
                const err = await res.json();
                console.error("send failed:", err);
            }
        } catch (err) {
            console.error("send error:", err);
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    }

    function formatTime(dateStr: string) {
        const d = new Date(dateStr);
        return d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
    }

    function getInitial(name: string) {
        return name.charAt(0).toUpperCase();
    }

    return (
        <>
            <div className="topbar">
                <div className="topbar-title">
                    <span className="text-muted">{channel.spaceName.toLowerCase()} /</span>{" "}
                    <span className="topbar-title-highlight">#</span>
                    {channel.name.toLowerCase()}
                </div>
            </div>
            <div className="chat-container">
                <div className="chat-messages">
                    {messages.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-state-icon">💬</div>
                            <div className="empty-state-title">no messages yet</div>
                            <div className="empty-state-text">
                                be the first to say something. no judgment here.
                            </div>
                        </div>
                    )}
                    {messages.map((msg) => (
                        <div key={msg.id} className="chat-message">
                            <div className="chat-message-avatar">
                                {getInitial(msg.user.name)}
                            </div>
                            <div className="chat-message-body">
                                <div className="chat-message-header">
                                    <span className="chat-message-name">{msg.user.name}</span>
                                    <span className="chat-message-time">
                                        {formatTime(msg.createdAt)}
                                    </span>
                                </div>
                                <div className="chat-message-content">{msg.content}</div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <div className="chat-input-area">
                    <form className="chat-input-form" onSubmit={handleSend}>
                        <span className="chat-input-prompt">{">"}</span>
                        <input
                            ref={inputRef}
                            type="text"
                            className="input"
                            placeholder={`message #${channel.name.toLowerCase()}...`}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={sending || !input.trim()}
                        >
                            send
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
