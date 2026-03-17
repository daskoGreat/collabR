"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useWalkthrough } from "./walkthrough-system";
import {
    Hash,
    Plus,
    Users,
    User,
    Settings,
    LogOut,
    X,
    LayoutDashboard,
    Activity,
    Heart,
    Shield,
    Briefcase,
    Sprout,
    Wind,
    Coffee,
    Focus,
    Star,
    UserCog,
    UserPlus,
    Inbox as LucideInbox,
    History as LucideHistory,
    HelpCircle,
    Search,
    Sparkles,
    Building2,
    MessageSquare
} from "lucide-react";
import UserMenu from "./user-menu";
import { Stack } from "@/components/layout/Stack";
import { Box } from "@/components/layout/Box";
import { Typography } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { AvatarPreview } from "./avatar-builder/AvatarPreview";

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
    otherUser?: { id: string; name: string; avatarId?: string };
    isOnline?: boolean;
    unreadCount?: number;
    hasMention?: boolean;
}

interface Props {
    user: { id: string; name: string; email: string; role: string; avatarId?: string };
    spaces: Space[];
    dmThreads: DmThread[];
    isOpen?: boolean;
    onClose?: () => void;
}

export default function AppSidebar({ user, spaces: initialSpaces, dmThreads: initialDmThreads, isOpen, onClose }: Props) {
    const { startWalkthrough } = useWalkthrough();
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

        const interval = setInterval(fetchSidebarData, 30000);

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

    useEffect(() => {
        setSpaces(initialSpaces);
        setDmThreads(initialDmThreads);
    }, [initialSpaces, initialDmThreads]);

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

            const res = await fetch("/api/messages/thread", {
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
                router.push(`/messages/${threadId}`);
            }
        } catch (err) {
            console.error("Failed to create thread:", err);
        } finally {
            setIsCreating(false);
        }
    }

    const isActive = (path: string) =>
        pathname === path || pathname.startsWith(path + "/");

    const isAdmin = user.role === "ADMIN" || user.role === "MODERATOR";

    return (
        <>
            <div
                className={`sidebar-overlay ${isOpen ? "visible" : ""}`}
                onClick={onClose}
            />
            <nav className={`sidebar ${isOpen ? "open" : ""}`}>
                <div className="sidebar-header">
                    <Stack direction="horizontal" justify="between" align="center" style={{ width: '100%' }}>
                        <div className="sidebar-logo" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                            network
                        </div>
                        {isRefreshing && <LoadingSpinner size={10} className="opacity-30" />}
                    </Stack>
                </div>

                <div className="sidebar-nav">
                    {/* NETWORK Section */}
                    <Box className="sidebar-section">
                        <Typography className="sidebar-section-title">Network</Typography>
                        <Stack direction="vertical" gap={2}>
                            <Link
                                href="/network"
                                className={`sidebar-link ${pathname === '/network' ? 'active' : ''}`}
                                onClick={onClose}
                            >
                                <LayoutDashboard size={16} className="sidebar-link-icon" />
                                <span>Overview</span>
                            </Link>
                            <Link
                                href="/network/pulse"
                                className={`sidebar-link ${pathname === '/network/pulse' ? 'active' : ''}`}
                                onClick={onClose}
                            >
                                <Activity size={16} className="sidebar-link-icon" />
                                <span>Pulse</span>
                            </Link>
                        </Stack>
                    </Box>

                    {/* COMMUNITY SPACES Section */}
                    <Box className="sidebar-section">
                        <Typography className="sidebar-section-title">Community Spaces</Typography>
                        <Stack direction="vertical" gap={2}>
                            {spaces.map((space) => {
                                const isActive = pathname.startsWith(`/spaces/${space.id}`);
                                return (
                                    <div key={space.id}>
                                        <Link
                                            href={`/spaces/${space.id}`}
                                            className={`sidebar-link ${isActive && !pathname.includes("/channels/") ? 'active' : ''}`}
                                            onClick={onClose}
                                        >
                                            <Hash size={16} className="sidebar-link-icon" />
                                            <span>{space.name}</span>
                                        </Link>

                                        {isActive && space.channels && space.channels.length > 0 && (
                                            <div className="sidebar-sub-nav">
                                                {space.channels.map(channel => (
                                                    <Link
                                                        key={channel.id}
                                                        href={`/spaces/${space.id}/channels/${channel.id}`}
                                                        className={`sidebar-link-sub ${pathname === `/spaces/${space.id}/channels/${channel.id}` ? 'active' : ''}`}
                                                        onClick={onClose}
                                                    >
                                                        <span className="sidebar-link-icon" style={{ opacity: 0.5 }}>#</span>
                                                        {channel.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </Stack>
                    </Box>

                    {/* SUPPORT NETWORK Section */}
                    <Box className="sidebar-section">
                        <Typography className="sidebar-section-title">Support Network</Typography>
                        <Stack direction="vertical" gap={2}>
                            {[
                                { name: 'General Support', icon: Heart },
                                { name: 'Life Challenges', icon: Shield },
                                { name: 'Career Discussions', icon: Briefcase },
                                { name: 'Personal Growth', icon: Sprout },
                                { name: 'Anxiety Support', icon: Wind },
                                { name: 'Stress Management', icon: Coffee },
                                { name: 'Mindfulness', icon: Focus }
                            ].map((item, i) => (
                                <button
                                    key={i}
                                    className="sidebar-link"
                                    style={{ opacity: 0.6, cursor: 'default' }}
                                >
                                    <item.icon size={16} className="sidebar-link-icon" />
                                    <span>{item.name}</span>
                                </button>
                            ))}
                        </Stack>
                    </Box>

                    {/* DIREKTMEDDELANDEN Section */}
                    <Box className="sidebar-section">
                        <Typography className="sidebar-section-title">Direktmeddelanden</Typography>
                        <Stack direction="vertical" gap={4}>
                            {dmThreads.map((thread) => {
                                const threadName = thread.isGroup ? thread.name : thread.otherUser?.name;
                                const isActive = pathname === `/messages/${thread.id}`;

                                return (
                                    <Link
                                        key={thread.id}
                                        href={`/messages/${thread.id}`}
                                        className={`sidebar-link ${isActive ? 'active' : ''}`}
                                        onClick={onClose}
                                        style={{ padding: '8px 12px' }}
                                    >
                                        <Box style={{ position: 'relative', flexShrink: 0 }}>
                                            <AvatarPreview
                                                avatarId={thread.otherUser?.avatarId}
                                                name={threadName}
                                                size={24}
                                            />
                                            {!thread.isGroup && thread.isOnline && (
                                                <div className="status-dot online" style={{
                                                    position: 'absolute',
                                                    bottom: -1,
                                                    right: -1,
                                                    width: 8,
                                                    height: 8,
                                                    border: '2px solid var(--bg-secondary)',
                                                    background: 'var(--neon-green)',
                                                    borderRadius: '50%'
                                                }} />
                                            )}
                                        </Box>
                                        <Typography
                                            style={{
                                                flex: 1,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                fontSize: '0.85rem',
                                                fontWeight: isActive ? 700 : 500,
                                                color: isActive ? 'white' : 'rgba(255,255,255,0.6)'
                                            }}
                                        >
                                            {threadName?.toLowerCase()}
                                        </Typography>
                                        {thread.unreadCount && thread.unreadCount > 0 && (
                                            <span className="badge-notification">{thread.unreadCount}</span>
                                        )}
                                        {thread.hasMention && <div className="mention-dot" />}
                                    </Link>
                                );
                            })}
                            <button
                                onClick={() => setShowNewChat(true)}
                                className="sidebar-link-action"
                                style={{
                                    marginTop: '4px',
                                    padding: '8px 12px',
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    color: 'rgba(255,255,255,0.3)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    borderRadius: '8px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Plus size={14} style={{ opacity: 0.5 }} />
                                <Typography style={{ fontSize: '0.8rem', fontWeight: 600 }}>nytt meddelande</Typography>
                            </button>
                        </Stack>
                    </Box>

                    {isAdmin && (
                        <div className="sidebar-section">
                            <div className="sidebar-section-header">
                                <div className="sidebar-section-title">Admin</div>
                            </div>
                            <Stack direction="vertical" gap="none">
                                <Link
                                    href="/admin"
                                    onClick={onClose}
                                    className={`sidebar-link ${pathname === "/admin" ? "active" : ""}`}
                                >
                                    <Box className="sidebar-link-icon">
                                        <Settings size={14} strokeWidth={2} />
                                    </Box>
                                    Overview
                                </Link>
                                <Link
                                    href="/admin/users"
                                    onClick={onClose}
                                    className={`sidebar-link ${isActive("/admin/users") ? "active" : ""}`}
                                >
                                    <Box className="sidebar-link-icon">
                                        <UserCog size={14} strokeWidth={2} />
                                    </Box>
                                    Users
                                </Link>
                                <Link
                                    href="/admin/invites"
                                    onClick={onClose}
                                    className={`sidebar-link ${isActive("/admin/invites") ? "active" : ""}`}
                                >
                                    <Box className="sidebar-link-icon">
                                        <UserPlus size={14} strokeWidth={2} />
                                    </Box>
                                    Invites
                                </Link>
                                <Link
                                    href="/admin/requests"
                                    onClick={onClose}
                                    className={`sidebar-link ${isActive("/admin/requests") ? "active" : ""}`}
                                >
                                    <Box className="sidebar-link-icon">
                                        <LucideInbox size={14} strokeWidth={2} />
                                    </Box>
                                    <span className="flex-1">Inbox</span>
                                </Link>

                                <Link
                                    href="/history"
                                    onClick={onClose}
                                    className={`sidebar-link ${isActive("/history") ? "active" : ""}`}
                                >
                                    <Box className="sidebar-link-icon">
                                        <LucideHistory size={14} strokeWidth={2} />
                                    </Box>
                                    History
                                </Link>
                                <Link
                                    href="/admin/reports"
                                    onClick={onClose}
                                    className={`sidebar-link ${isActive("/admin/reports") ? "active" : ""}`}
                                >
                                    <Box className="sidebar-link-icon">
                                        <X size={14} strokeWidth={2} />
                                    </Box>
                                    Reports
                                </Link>
                                <Link
                                    href="/admin/audit"
                                    onClick={onClose}
                                    className={`sidebar-link ${isActive("/admin/audit") ? "active" : ""}`}
                                >
                                    <Box className="sidebar-link-icon">
                                        <LucideHistory size={14} strokeWidth={2} />
                                    </Box>
                                    Audit Log
                                </Link>
                            </Stack>
                        </div>
                    )}
                </div>

                <div className="sidebar-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '20px 24px' }}>
                    <Stack direction="vertical" gap={16}>
                        <button
                            onClick={() => startWalkthrough([
                                { targetId: 'nav-navet', title: 'Network Overview', content: 'Få en fullständig överblick över vad som händer i nätverket.' },
                                { targetId: 'nav-insikter', title: 'Network Pulse', content: 'Flödet där alla delar med sig av vad de lärt sig.' },
                                { targetId: 'nav-kontor', title: 'Kontor', content: 'Dina samarbeten är uppdelade i kontor.' },
                                { targetId: 'nav-direktmeddelanden', title: 'Meddelanden', content: 'Konversationer mellan två personer eller små grupper.' }
                            ])}
                            className="sidebar-guide-btn"
                            style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '12px',
                                padding: '10px 14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                width: '100%'
                            }}
                        >
                            <HelpCircle size={14} style={{ opacity: 0.5 }} />
                            <Typography style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Guide</Typography>
                        </button>

                        <Link href="/profile" onClick={onClose} style={{ textDecoration: 'none', display: 'block' }}>
                            <Box style={{
                                padding: '8px 12px',
                                borderRadius: '16px',
                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                cursor: 'pointer'
                            }} className="hover:bg-white/5 hover:scale-[1.02] active:scale-[0.98]">
                                <Stack direction="horizontal" gap={12} align="center">
                                    <AvatarPreview avatarId={user.avatarId} size={36} />
                                    <Stack direction="vertical" gap={0}>
                                        <Typography style={{ fontWeight: 800, fontSize: '0.85rem', color: '#fff' }}>
                                            {user.name.toLowerCase()}
                                        </Typography>
                                        <Typography style={{ fontSize: '0.7rem', color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>
                                            visa profil
                                        </Typography>
                                    </Stack>
                                </Stack>
                            </Box>
                        </Link>
                    </Stack>
                </div>
            </nav>

            {showNewChat && (
                <div className="modal-overlay">
                    <Card style={{ maxWidth: '400px', width: '90%', margin: '0 auto' }}>
                        <Stack direction="vertical" gap="lg">
                            <Stack direction="horizontal" justify="between" align="center">
                                <Typography variant="h3">New Conversation</Typography>
                                <button onClick={() => setShowNewChat(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                    <X size={20} strokeWidth={1.5} />
                                </button>
                            </Stack>

                            <Stack direction="vertical" gap="md">
                                <Box style={{ position: 'relative' }}>
                                    <Search size={14} className="text-secondary opacity-40" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                    <input
                                        type="text"
                                        className="input w-full"
                                        style={{ paddingLeft: '36px' }}
                                        placeholder="Name or email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        autoFocus
                                    />
                                </Box>

                                {searchResults.length > 0 && (
                                    <Box style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-subtle)' }}>
                                        {searchResults.map(u => (
                                            <button
                                                key={u.id}
                                                className="sidebar-link"
                                                onClick={() => {
                                                    if (!selectedUsers.find(s => s.id === u.id)) {
                                                        setSelectedUsers([...selectedUsers, u]);
                                                    }
                                                    setSearchQuery("");
                                                    setSearchResults([]);
                                                }}
                                            >
                                                <User size={14} style={{ marginRight: '8px' }} />
                                                {u.name.toLowerCase()}
                                            </button>
                                        ))}
                                    </Box>
                                )}
                            </Stack>

                            {selectedUsers.length > 0 && (
                                <Stack direction="vertical" gap="xs">
                                    <Typography variant="caption">Selected:</Typography>
                                    <Stack direction="horizontal" gap="xs" wrap="wrap">
                                        {selectedUsers.map(u => (
                                            <Box key={u.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Typography variant="caption">{u.name.toLowerCase()}</Typography>
                                                <button onClick={() => setSelectedUsers(selectedUsers.filter(s => s.id !== u.id))} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                                    <X size={10} />
                                                </button>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Stack>
                            )}

                            {selectedUsers.length > 1 && (
                                <Box>
                                    <Typography variant="caption">Group Name (optional)</Typography>
                                    <input
                                        type="text"
                                        className="input w-full"
                                        placeholder="Team alpha, Weekend plans, etc..."
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                    />
                                </Box>
                            )}

                            <Stack direction="horizontal" justify="end" gap="md">
                                <button className="btn btn-secondary" onClick={() => setShowNewChat(false)}>Cancel</button>
                                <button
                                    className="btn btn-primary"
                                    disabled={selectedUsers.length === 0 || isCreating}
                                    onClick={handleCreateThread}
                                >
                                    {isCreating ? "Creating..." : selectedUsers.length > 1 ? "Create Group" : "Start Chat"}
                                </button>
                            </Stack>
                        </Stack>
                    </Card>
                </div>
            )}
        </>
    );
}
