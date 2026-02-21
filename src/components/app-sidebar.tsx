"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";

interface Channel {
    id: string;
    name: string;
    unreadCount?: number;
}

interface Space {
    id: string;
    name: string;
    channels?: Channel[];
}

interface DmThread {
    id: string;
    otherUser: { id: string; name: string };
    unreadCount?: number;
}

interface Props {
    user: { id: string; name: string; email: string; role: string };
    spaces: Space[];
    dmThreads: DmThread[];
    isOpen?: boolean;
    onClose?: () => void;
}

export default function AppSidebar({ user, spaces: initialSpaces, dmThreads: initialDmThreads, isOpen, onClose }: Props) {
    const pathname = usePathname();
    const [spaces, setSpaces] = useState(initialSpaces);
    const [dmThreads, setDmThreads] = useState(initialDmThreads);

    useEffect(() => {
        const fetchSidebarData = async () => {
            try {
                const res = await fetch("/api/sidebar");
                if (res.ok) {
                    const data = await res.json();
                    setSpaces(data.spaces);
                    setDmThreads(data.dmThreads);
                }
            } catch (err) {
                console.error("Failed to fetch sidebar data:", err);
            }
        };

        // Poll as fallback
        const interval = setInterval(fetchSidebarData, 30000);

        // Pusher for immediate updates
        let cleanup: (() => void) | undefined;
        try {
            const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
            const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
            if (key && cluster) {
                import("pusher-js").then(({ default: PusherClient }) => {
                    const pusher = new PusherClient(key, { cluster });
                    const channel = pusher.subscribe(`user-${user.id}`);
                    channel.bind("sidebar-update", () => {
                        fetchSidebarData();
                    });
                    cleanup = () => {
                        channel.unbind_all();
                        pusher.unsubscribe(`user-${user.id}`);
                        pusher.disconnect();
                    };
                });
            }
        } catch (err) {
            console.error("Pusher setup failed in sidebar:", err);
        }

        return () => {
            clearInterval(interval);
            cleanup?.();
        };
    }, [user.id]);

    // Also update if initial props change
    useEffect(() => {
        setSpaces(initialSpaces);
        setDmThreads(initialDmThreads);
    }, [initialSpaces, initialDmThreads]);

    const isActive = (path: string) =>
        pathname === path || pathname.startsWith(path + "/");

    const initial = user.name.charAt(0).toUpperCase();
    const isAdmin = user.role === "ADMIN" || user.role === "MODERATOR";

    return (
        <>
            <div
                className={`sidebar-overlay ${isOpen ? "visible" : ""}`}
                onClick={onClose}
            />
            <nav className={`sidebar ${isOpen ? "open" : ""}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <span className="sidebar-logo-prefix">~/</span>collab
                    </div>
                </div>

                <div className="sidebar-nav">
                    <Link
                        href="/spaces"
                        onClick={onClose}
                        className={`sidebar-link ${isActive("/spaces") && !pathname.includes("/spaces/") ? "active" : ""}`}
                    >
                        <span className="sidebar-link-icon">⌂</span>
                        spaces
                    </Link>

                    <div className="sidebar-section">
                        <div className="sidebar-section-title">your spaces</div>
                        {spaces.map((space) => (
                            <div key={space.id} className="sidebar-group">
                                <Link
                                    href={`/spaces/${space.id}`}
                                    onClick={onClose}
                                    className={`sidebar-link ${isActive(`/spaces/${space.id}`) && !pathname.includes("/chat/") ? "active" : ""}`}
                                >
                                    <span className="sidebar-link-icon">#</span>
                                    {space.name.toLowerCase()}
                                </Link>
                                <div className="sidebar-sub-nav">
                                    {space.channels?.map((ch) => (
                                        <Link
                                            key={ch.id}
                                            href={`/spaces/${space.id}/chat/${ch.id}`}
                                            className={`sidebar-link sidebar-link-sub ${isActive(`/spaces/${space.id}/chat/${ch.id}`) ? "active" : ""}`}
                                            onClick={onClose}
                                        >
                                            <span className="sidebar-link-icon">#</span>
                                            <span className="sidebar-link-text">{ch.name.toLowerCase()}</span>
                                            {ch.unreadCount && ch.unreadCount > 0 ? (
                                                <span className="badge badge-notification">{ch.unreadCount}</span>
                                            ) : null}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {spaces.length === 0 && (
                            <div className="sidebar-link text-muted" style={{ cursor: "default" }}>
                                <span className="sidebar-link-icon">∅</span>
                                no spaces yet
                            </div>
                        )}
                    </div>

                    {/* Direct Messages */}
                    <div className="sidebar-section">
                        <div className="sidebar-section-title">direct messages</div>
                        {dmThreads.map((thread) => (
                            <Link
                                key={thread.id}
                                href={`/dm/${thread.id}`}
                                onClick={onClose}
                                className={`sidebar-link ${isActive(`/dm/${thread.id}`) ? "active" : ""}`}
                            >
                                <span className="sidebar-link-icon">@</span>
                                {thread.otherUser.name.toLowerCase()}
                                {thread.unreadCount && thread.unreadCount > 0 ? (
                                    <span className="badge badge-notification">{thread.unreadCount}</span>
                                ) : null}
                            </Link>
                        ))}
                        {dmThreads.length === 0 && (
                            <div className="sidebar-link text-muted" style={{ cursor: "default", fontSize: "var(--font-size-xs)" }}>
                                <span className="sidebar-link-icon">∅</span>
                                no conversations yet
                            </div>
                        )}
                    </div>

                    {isAdmin && (
                        <div className="sidebar-section">
                            <div className="sidebar-section-title">admin</div>
                            <Link
                                href="/admin"
                                onClick={onClose}
                                className={`sidebar-link ${pathname === "/admin" ? "active" : ""}`}
                            >
                                <span className="sidebar-link-icon">⚙</span>
                                dashboard
                            </Link>
                            <Link
                                href="/admin/users"
                                onClick={onClose}
                                className={`sidebar-link ${isActive("/admin/users") ? "active" : ""}`}
                            >
                                <span className="sidebar-link-icon">⊡</span>
                                users
                            </Link>
                            <Link
                                href="/admin/invites"
                                onClick={onClose}
                                className={`sidebar-link ${isActive("/admin/invites") ? "active" : ""}`}
                            >
                                <span className="sidebar-link-icon">⊞</span>
                                invites
                            </Link>
                            <Link
                                href="/admin/reports"
                                onClick={onClose}
                                className={`sidebar-link ${isActive("/admin/reports") ? "active" : ""}`}
                            >
                                <span className="sidebar-link-icon">⚑</span>
                                reports
                            </Link>
                            <Link
                                href="/admin/audit"
                                onClick={onClose}
                                className={`sidebar-link ${isActive("/admin/audit") ? "active" : ""}`}
                            >
                                <span className="sidebar-link-icon">◎</span>
                                audit log
                            </Link>
                        </div>
                    )}
                </div>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-user-avatar">{initial}</div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">{user.name}</div>
                            <div className="sidebar-user-role">{user.role.toLowerCase()}</div>
                        </div>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            title="logout"
                        >
                            ⏻
                        </button>
                    </div>
                </div>
            </nav>
        </>
    );
}
