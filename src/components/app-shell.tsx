"use client";

import { useState } from "react";
import AppSidebar from "./app-sidebar";
import UserMenu from "./user-menu";
import { WalkthroughProvider } from "./walkthrough-system";
import { Container } from "./layout/Container";
import { Stack } from "./layout/Stack";
import { Box } from "./layout/Box";
import { Typography } from "./ui/typography";
import { Menu } from "lucide-react";

interface Props {
    user: { id: string; name: string; email: string; role: string; avatarId?: string };
    spaces: { id: string; name: string; channels?: { id: string; name: string; unreadCount?: number }[] }[];
    dmThreads: {
        id: string;
        isGroup: boolean;
        name?: string;
        memberCount?: number;
        otherUser?: { id: string; name: string };
        isOnline?: boolean;
        unreadCount?: number;
        hasMention?: boolean;
    }[];
    children: React.ReactNode;
}

export default function AppShell({ user, spaces, dmThreads, children }: Props) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <WalkthroughProvider>
            <div className="app-shell">
                <div className="app-main">
                    <AppSidebar
                        user={user}
                        spaces={spaces}
                        dmThreads={dmThreads}
                        isOpen={isSidebarOpen}
                        onClose={() => setIsSidebarOpen(false)}
                    />

                    <div className="main-content">
                        {/* Global Top Header */}
                        <header className="app-header" style={{
                            position: 'sticky',
                            top: 0,
                            zIndex: 100,
                            background: 'rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(20px)',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            padding: '0.75rem 1.5rem',
                        }}>
                            <Stack direction="horizontal" justify="between" align="center" style={{ width: '100%' }}>
                                <Box className="lg:hidden">
                                    <button
                                        className="mobile-menu-btn"
                                        onClick={() => setIsSidebarOpen(true)}
                                        aria-label="Open menu"
                                        style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px' }}
                                    >
                                        <Menu size={20} opacity={0.6} />
                                    </button>
                                </Box>

                                <Box className="desktop-brand hidden lg:block">
                                    <Typography style={{
                                        fontSize: '0.85rem',
                                        fontWeight: 800,
                                        letterSpacing: '0.1em',
                                        textTransform: 'uppercase',
                                        opacity: 0.3
                                    }}>
                                        The Support Network
                                    </Typography>
                                </Box>

                                <Typography variant="caption" style={{ fontWeight: 800 }} className="lg:hidden">network</Typography>

                                <Box style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {/* Placeholder for Search or Notifications */}
                                    <UserMenu user={user} />
                                </Box>
                            </Stack>
                        </header>

                        <div className="content-area" style={{ padding: '0' }}>
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </WalkthroughProvider>
    );
}
