"use client";

import { useState } from "react";
import AppSidebar from "./app-sidebar";

interface Props {
    user: { id: string; name: string; email: string; role: string };
    spaces: { id: string; name: string; channels?: { id: string; name: string; unreadCount?: number }[] }[];
    dmThreads: { id: string; otherUser: { id: string; name: string }; unreadCount?: number }[];
    children: React.ReactNode;
}

export default function AppShell({ user, spaces, dmThreads, children }: Props) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="app-shell">
            {/* Mobile Header - only visible via CSS media query */}
            <header className="mobile-header">
                <button
                    className="mobile-menu-btn"
                    onClick={() => setIsSidebarOpen(true)}
                    aria-label="Open menu"
                >
                    ☰
                </button>
                <div className="sidebar-logo" style={{ fontSize: "1.1rem" }}>
                    <span className="sidebar-logo-prefix">~/</span>collab
                </div>
            </header>

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
    );
}
