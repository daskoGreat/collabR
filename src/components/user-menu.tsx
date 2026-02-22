"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import LogoutConfirmation from "./logout-confirmation";

interface Props {
    user: { name: string; email: string; role: string };
}

export default function UserMenu({ user }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const initial = user.name.charAt(0).toUpperCase();

    return (
        <div className="user-menu-container" ref={menuRef} style={{ position: "relative" }}>
            <button
                className="btn btn-ghost"
                onClick={() => setIsOpen(!isOpen)}
                style={{ padding: "var(--space-2)", fontSize: "1.2rem" }}
                aria-label="User menu"
            >
                ⋮
            </button>

            {isOpen && (
                <div
                    className="card card-compact"
                    style={{
                        position: "absolute",
                        top: "100%",
                        right: 0,
                        marginTop: "var(--space-2)",
                        minWidth: "200px",
                        zIndex: 100,
                        boxShadow: "var(--shadow-lg)"
                    }}
                >
                    <div className="sidebar-user" style={{ padding: "var(--space-2)", borderBottom: "1px solid var(--border-subtle)" }}>
                        <div className="sidebar-user-avatar">{initial}</div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">{user.name}</div>
                            <div className="sidebar-user-role">{user.role.toLowerCase()}</div>
                        </div>
                    </div>

                    <div style={{ padding: "var(--space-1)" }}>
                        <button className="sidebar-link" style={{ width: "100%", textAlign: "left", opacity: 0.6, cursor: "default" }}>
                            <span className="sidebar-link-icon">👤</span>
                            Profil (kommer snart)
                        </button>
                        <button className="sidebar-link" style={{ width: "100%", textAlign: "left", opacity: 0.6, cursor: "default" }}>
                            <span className="sidebar-link-icon">⚙</span>
                            Inställningar (kommer snart)
                        </button>
                        <div style={{ height: "1px", background: "var(--border-subtle)", margin: "var(--space-1) 0" }} />
                        <button
                            className="sidebar-link text-danger"
                            style={{ width: "100%", textAlign: "left" }}
                            onClick={() => {
                                setIsOpen(false);
                                setShowLogoutConfirm(true);
                            }}
                        >
                            <span className="sidebar-link-icon">⏻</span>
                            Logga ut
                        </button>
                    </div>
                </div>
            )}

            <LogoutConfirmation
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={() => signOut({ callbackUrl: "/login" })}
            />
        </div>
    );
}
