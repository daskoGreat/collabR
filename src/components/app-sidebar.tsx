"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface Space {
    id: string;
    name: string;
}

interface Props {
    user: { id: string; name: string; email: string; role: string };
    spaces: Space[];
}

export default function AppSidebar({ user, spaces }: Props) {
    const pathname = usePathname();

    const isActive = (path: string) =>
        pathname === path || pathname.startsWith(path + "/");

    const initial = user.name.charAt(0).toUpperCase();
    const isAdmin = user.role === "ADMIN" || user.role === "MODERATOR";

    return (
        <nav className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <span className="sidebar-logo-prefix">~/</span>collab
                </div>
            </div>

            <div className="sidebar-nav">
                <Link
                    href="/spaces"
                    className={`sidebar-link ${isActive("/spaces") && !pathname.includes("/spaces/") ? "active" : ""}`}
                >
                    <span className="sidebar-link-icon">⌂</span>
                    spaces
                </Link>

                <div className="sidebar-section">
                    <div className="sidebar-section-title">your spaces</div>
                    {spaces.map((space) => (
                        <Link
                            key={space.id}
                            href={`/spaces/${space.id}`}
                            className={`sidebar-link ${isActive(`/spaces/${space.id}`) ? "active" : ""}`}
                        >
                            <span className="sidebar-link-icon">#</span>
                            {space.name.toLowerCase()}
                        </Link>
                    ))}
                    {spaces.length === 0 && (
                        <div className="sidebar-link text-muted" style={{ cursor: "default" }}>
                            <span className="sidebar-link-icon">∅</span>
                            no spaces yet
                        </div>
                    )}
                </div>

                {isAdmin && (
                    <div className="sidebar-section">
                        <div className="sidebar-section-title">admin</div>
                        <Link
                            href="/admin"
                            className={`sidebar-link ${pathname === "/admin" ? "active" : ""}`}
                        >
                            <span className="sidebar-link-icon">⚙</span>
                            dashboard
                        </Link>
                        <Link
                            href="/admin/users"
                            className={`sidebar-link ${isActive("/admin/users") ? "active" : ""}`}
                        >
                            <span className="sidebar-link-icon">⊡</span>
                            users
                        </Link>
                        <Link
                            href="/admin/invites"
                            className={`sidebar-link ${isActive("/admin/invites") ? "active" : ""}`}
                        >
                            <span className="sidebar-link-icon">⊞</span>
                            invites
                        </Link>
                        <Link
                            href="/admin/reports"
                            className={`sidebar-link ${isActive("/admin/reports") ? "active" : ""}`}
                        >
                            <span className="sidebar-link-icon">⚑</span>
                            reports
                        </Link>
                        <Link
                            href="/admin/audit"
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
    );
}
