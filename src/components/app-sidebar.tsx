"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

import {
    LayoutDashboard,
    Sparkles,
    Hash,
    MessageSquare,
    User,
    Users,
    Star,
    Settings,
    UserCog,
    UserPlus,
    History,
    Plus,
    X,
    Search
} from "lucide-react";

interface Channel {
    id: string;
    name: string;
    unreadCount?: number;
    hasMention?: boolean;
}

interface Space {
    id: string;
    name: string;
    channels?: Channel[];
}

interface DmThread {
    id: string;
    isGroup: boolean;
    name?: string;
    memberCount?: number;
    otherUser?: { id: string; name: string };
    isOnline?: boolean;
    unreadCount?: number;
    hasMention?: boolean;
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
    const router = useRouter();
    const [spaces, setSpaces] = useState(initialSpaces);
    const [dmThreads, setDmThreads] = useState(initialDmThreads);
    const [hasOpportunityMention, setHasOpportunityMention] = useState(false);
    const [hasFeedMention, setHasFeedMention] = useState(false);
    const [openHelpCount, setOpenHelpCount] = useState(0);
    const [showNewChat, setShowNewChat] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
    const [groupName, setGroupName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        const fetchSidebarData = async () => {
            setIsRefreshing(true);
            try {
                const res = await fetch("/api/sidebar");
                if (res.ok) {
                    const data = await res.json();
                    setSpaces(data.spaces);
                    setDmThreads(data.dmThreads);
                    setHasOpportunityMention(data.hasOpportunityMention);
                    setHasFeedMention(data.hasFeedMention);
                    setOpenHelpCount(data.openHelpCount);
                }
            } catch (err) {
                console.error("Failed to fetch sidebar data:", err);
            } finally {
                setIsRefreshing(false);
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

    // Search users for new chat
    useEffect(() => {
        if (searchQuery.length < 1) {
            setSearchResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            const res = await fetch(`/api/users/search?q=${searchQuery}`);
            if (res.ok) {
                const data = await res.json();
                setSearchResults(data.filter((u: any) => u.id !== user.id));
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, user.id]);

    async function handleCreateThread() {
        if (selectedUsers.length === 0) return;
        setIsCreating(true);
        try {
            const body = selectedUsers.length === 1
                ? { targetUserId: selectedUsers[0].id }
                : { participants: selectedUsers.map(u => u.id), name: groupName };

            const res = await fetch("/api/dm/thread", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                const { threadId } = await res.json();
                setShowNewChat(false);
                setSelectedUsers([]);
                setSearchQuery("");
                setGroupName("");
                router.push(`/dm/${threadId}`);
            }
        } catch (err) {
            console.error("Failed to create thread:", err);
        } finally {
            setIsCreating(false);
        }
    }

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
                    <div className="sidebar-logo flex items-center gap-2">
                        <span className="sidebar-logo-prefix">~/</span>collab
                        {isRefreshing && <LoadingSpinner size={12} className="opacity-50" />}
                    </div>
                </div>

                <div className="sidebar-nav">
                    <Link
                        href="/spaces"
                        onClick={onClose}
                        className={`sidebar-link ${isActive("/spaces") && !pathname.includes("/spaces/") ? "active" : ""}`}
                    >
                        <span className="sidebar-link-icon">
                            <LayoutDashboard size={18} strokeWidth={1.5} />
                        </span>
                        <span className="flex-1">navet</span>
                        {openHelpCount > 0 && (
                            <span className="badge badge-primary scale-75">
                                {openHelpCount}
                            </span>
                        )}
                    </Link>

                    <Link
                        href="/feed"
                        onClick={onClose}
                        className={`sidebar-link ${isActive("/feed") ? "active" : ""}`}
                    >
                        <span className="sidebar-link-icon">
                            <Sparkles size={18} strokeWidth={1.5} />
                        </span>
                        insikter
                        {hasFeedMention && (
                            <span className="mention-dot" title="Nya omnämnanden i feeden" />
                        )}
                    </Link>

                    <div className="sidebar-section">
                        <div className="sidebar-section-header">
                            <div className="sidebar-section-title">your spaces</div>
                        </div>
                        {spaces.map((space) => (
                            <div key={space.id} className="sidebar-group">
                                <Link
                                    href={`/spaces/${space.id}`}
                                    onClick={onClose}
                                    className={`sidebar-link ${isActive(`/spaces/${space.id}`) && !pathname.includes("/chat/") ? "active" : ""}`}
                                >
                                    <span className="sidebar-link-icon">
                                        <Hash size={18} strokeWidth={1.5} />
                                    </span>
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
                                            <span className="sidebar-link-icon">
                                                <Hash size={14} strokeWidth={1.5} />
                                            </span>
                                            <span className="sidebar-link-text">{ch.name.toLowerCase()}</span>
                                            {ch.hasMention ? (
                                                <span className="badge badge-notification badge-mention">!</span>
                                            ) : ch.unreadCount && ch.unreadCount > 0 ? (
                                                <span className="badge badge-notification">{ch.unreadCount}</span>
                                            ) : null}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {spaces.length === 0 && (
                            <div className="sidebar-link text-muted" style={{ cursor: "default" }}>
                                <span className="sidebar-link-icon">
                                    <Hash size={18} strokeWidth={1.5} className="opacity-20" />
                                </span>
                                no spaces yet
                            </div>
                        )}
                    </div>

                    {/* Direct Messages */}
                    <div className="sidebar-section">
                        <div className="sidebar-section-header">
                            <div className="sidebar-section-title">direct messages</div>
                            <button
                                className="btn-sidebar-action"
                                onClick={() => setShowNewChat(true)}
                                title="New Chat"
                            >
                                <Plus size={16} strokeWidth={2} />
                            </button>
                        </div>
                        {dmThreads.map((thread) => (
                            <Link
                                key={thread.id}
                                href={`/dm/${thread.id}`}
                                onClick={onClose}
                                className={`sidebar-link ${isActive(`/dm/${thread.id}`) ? "active" : ""}`}
                            >
                                <span className={`sidebar-link-icon ${!thread.isGroup && thread.isOnline ? "text-success" : ""}`}>
                                    {thread.isGroup ? <Users size={16} strokeWidth={1.5} /> : <User size={16} strokeWidth={1.5} />}
                                </span>
                                <span className="flex-1 truncate">
                                    {thread.isGroup
                                        ? (thread.name || "Namnlös grupp")
                                        : (thread.otherUser?.name.toLowerCase())}
                                </span>
                                {thread.isGroup && (
                                    <span className="text-[10px] text-muted opacity-50 mr-2">{thread.memberCount}</span>
                                )}
                                {!thread.isGroup && thread.isOnline && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_4px_var(--success)] mr-2" />
                                )}
                                {thread.hasMention ? (
                                    <span className="badge badge-notification badge-mention">!</span>
                                ) : thread.unreadCount && thread.unreadCount > 0 ? (
                                    <span className="badge badge-notification">{thread.unreadCount}</span>
                                ) : null}
                            </Link>
                        ))}
                        {dmThreads.length === 0 && (
                            <div className="sidebar-link text-muted" style={{ cursor: "default", fontSize: "var(--font-size-xs)" }}>
                                <span className="sidebar-link-icon">
                                    <MessageSquare size={16} strokeWidth={1.5} className="opacity-20" />
                                </span>
                                no conversations yet
                            </div>
                        )}
                    </div>

                    <div className="sidebar-section">
                        <div className="sidebar-section-header">
                            <div className="sidebar-section-title">marknad</div>
                        </div>
                        <Link
                            href="/opportunities"
                            onClick={onClose}
                            className={`sidebar-link ${isActive("/opportunities") ? "active" : ""}`}
                        >
                            <span className="sidebar-link-icon">
                                <Star size={18} strokeWidth={1.5} />
                            </span>
                            jobb & möjligheter
                            {hasOpportunityMention && (
                                <span className="badge badge-notification badge-mention">!</span>
                            )}
                        </Link>
                    </div>

                    {isAdmin && (
                        <div className="sidebar-section">
                            <div className="sidebar-section-header">
                                <div className="sidebar-section-title">admin</div>
                            </div>
                            <Link
                                href="/admin"
                                onClick={onClose}
                                className={`sidebar-link ${pathname === "/admin" ? "active" : ""}`}
                            >
                                <span className="sidebar-link-icon text-[14px]">
                                    <Settings size={16} strokeWidth={1.5} />
                                </span>
                                dashboard
                            </Link>
                            <Link
                                href="/admin/users"
                                onClick={onClose}
                                className={`sidebar-link ${isActive("/admin/users") ? "active" : ""}`}
                            >
                                <span className="sidebar-link-icon text-[14px]">
                                    <UserCog size={16} strokeWidth={1.5} />
                                </span>
                                users
                            </Link>
                            <Link
                                href="/admin/invites"
                                onClick={onClose}
                                className={`sidebar-link ${isActive("/admin/invites") ? "active" : ""}`}
                            >
                                <span className="sidebar-link-icon text-[14px]">
                                    <UserPlus size={16} strokeWidth={1.5} />
                                </span>
                                invites
                            </Link>
                            <Link
                                href="/admin/reports"
                                onClick={onClose}
                                className={`sidebar-link ${isActive("/admin/reports") ? "active" : ""}`}
                            >
                                <span className="sidebar-link-icon text-[14px]">
                                    <X size={16} strokeWidth={1.5} />
                                </span>
                                reports
                            </Link>
                            <Link
                                href="/admin/audit"
                                onClick={onClose}
                                className={`sidebar-link ${isActive("/admin/audit") ? "active" : ""}`}
                            >
                                <span className="sidebar-link-icon text-[14px]">
                                    <History size={16} strokeWidth={1.5} />
                                </span>
                                audit log
                            </Link>
                        </div>
                    )}
                </div>

                <div className="sidebar-footer">
                    <div className="sidebar-user" style={{ opacity: 0.7 }}>
                        <div className="sidebar-user-avatar">{initial}</div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">{user.name}</div>
                            <div className="sidebar-user-role">{user.role.toLowerCase()}</div>
                        </div>
                    </div>
                </div>
            </nav>

            {showNewChat && (
                <div className="modal-overlay">
                    <div className="card max-w-md w-full p-6 shadow-2xl border border-primary/20">
                        <div className="modal-title flex justify-between items-center mb-6">
                            <span>ny konversation</span>
                            <button className="text-muted hover:text-white transition-colors" onClick={() => setShowNewChat(false)}>
                                <X size={20} strokeWidth={1.5} />
                            </button>
                        </div>

                        <div className="form-group mb-4">
                            <label className="form-label">sök medlemmar</label>
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                                <input
                                    type="text"
                                    className="input w-full pl-10"
                                    placeholder="namn eller e-post..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            {searchResults.length > 0 && (
                                <div className="card card-compact mt-1 max-h-[200px] overflow-y-auto border border-subtle">
                                    {searchResults.map(u => (
                                        <button
                                            key={u.id}
                                            className="sidebar-link w-full text-left"
                                            onClick={() => {
                                                if (!selectedUsers.find(s => s.id === u.id)) {
                                                    setSelectedUsers([...selectedUsers, u]);
                                                }
                                                setSearchQuery("");
                                                setSearchResults([]);
                                            }}
                                        >
                                            <span className="sidebar-link-icon">
                                                <User size={14} strokeWidth={1.5} />
                                            </span>
                                            {u.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedUsers.length > 0 && (
                            <div className="mb-6">
                                <label className="form-label mb-2">valda:</label>
                                <div className="flex flex-wrap gap-2">
                                    {selectedUsers.map(u => (
                                        <div key={u.id} className="badge p-2 bg-primary/10 border border-primary/30 flex items-center gap-2">
                                            <span>{u.name}</span>
                                            <button className="text-muted hover:text-danger" onClick={() => setSelectedUsers(selectedUsers.filter(s => s.id !== u.id))}>
                                                <X size={12} strokeWidth={2} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedUsers.length > 1 && (
                            <div className="form-group mb-6">
                                <label className="form-label">gruppnamn (valfritt)</label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    placeholder="mitt team, helgplaner, etc..."
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowNewChat(false)}>avbryt</button>
                            <button
                                className="btn btn-primary flex items-center gap-2 justify-center"
                                disabled={selectedUsers.length === 0 || isCreating}
                                onClick={handleCreateThread}
                            >
                                {isCreating && <LoadingSpinner size="sm" className="text-current" />}
                                <span>{isCreating ? "skapar..." : selectedUsers.length > 1 ? "skapa grupp" : "starta chatt"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
