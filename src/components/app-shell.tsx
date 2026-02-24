"use client";

import { useState } from "react";
import AppSidebar from "./app-sidebar";
import UserMenu from "./user-menu";
import { WalkthroughProvider } from "./walkthrough-system";

interface Props {
    user: { id: string; name: string; email: string; role: string };
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
                {/* Desktop & Mobile Header */}
                <header className="app-header">
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setIsSidebarOpen(true)}
                        aria-label="Open menu"
                    >
                        <span className="mobile-menu-icon">☰</span>
                    </button>
                    <div className="sidebar-logo">
                        <span className="sidebar-logo-prefix">~/</span>collab
                    </div>
                    <div className="header-actions">
                        <UserMenu user={user} />
                    </div>
                </header>

                <div className="app-main">
                    <AppSidebar
                        user={user}
                        spaces={spaces}
                        dmThreads={dmThreads}
                        isOpen={isSidebarOpen}
                        onClose={() => setIsSidebarOpen(false)}
                    />

                    <div className="main-content">
                        {children}
                    </div>
                </div>
            </div>
        </WalkthroughProvider>
    );
}
