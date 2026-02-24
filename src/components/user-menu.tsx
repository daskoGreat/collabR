"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import LogoutConfirmation from "./logout-confirmation";

interface Props {
    user: { name: string; email: string; role: string };
}

export default function UserMenu({ user }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();
    const menuRef = useRef<HTMLDivElement>(null);

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

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

    if (!mounted) return null;

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
                    className="card p-0 overflow-hidden shadow-2xl"
                    style={{
                        position: "absolute",
                        top: "calc(100% + var(--space-2))",
                        right: 0,
                        minWidth: "240px",
                        zIndex: 1000,
                        background: "var(--bg-secondary)",
                        border: "1px solid var(--border-active)",
                        boxShadow: "var(--shadow-lg), 0 0 20px var(--neon-green-glow)",
                        animation: "fadeIn 0.2s ease-out"
                    }}
                >
                    <div className="sidebar-user" style={{ padding: "var(--space-4)", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-glass)" }}>
                        <div className="sidebar-user-avatar" style={{ width: "40px", height: "40px", fontSize: "14px" }}>{initial}</div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name" style={{ fontSize: "var(--font-size-sm)", fontWeight: 700 }}>{user.name}</div>
                            <div className="sidebar-user-role" style={{ fontSize: "10px", color: "var(--text-secondary)" }}>{user.role.toLowerCase()}</div>
                        </div>
                    </div>

                    <div style={{ padding: "var(--space-1)" }}>
                        <Link
                            href="/profile"
                            className="sidebar-link"
                            style={{ display: "flex", width: "100%", textAlign: "left" }}
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="sidebar-link-icon">👤</span>
                            Profil
                        </Link>
                        <Link
                            href="/settings"
                            className="sidebar-link"
                            style={{ display: "flex", width: "100%", textAlign: "left" }}
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="sidebar-link-icon">⚙</span>
                            Inställningar
                        </Link>

                        <div style={{ height: "1px", background: "var(--border-subtle)", margin: "var(--space-1) 0" }} />

                        <button
                            className="sidebar-link w-full text-left"
                            style={{ background: "none", border: "none", width: "100%", cursor: "pointer" }}
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        >
                            <span className="sidebar-link-icon">{theme === "dark" ? "☀️" : "🌙"}</span>
                            {theme === "dark" ? "Dagläge" : "Nattläge"}
                        </button>

                        <div style={{ height: "1px", background: "var(--border-subtle)", margin: "var(--space-1) 0" }} />

                        <button
                            className="sidebar-link text-danger w-full text-left"
                            style={{
                                background: "none",
                                border: "none",
                                padding: "var(--space-2) var(--space-3)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "var(--space-3)",
                                width: "100%",
                                color: "var(--accent-danger)",
                                font: "inherit"
                            }}
                            onClick={() => {
                                setIsOpen(false);
                                setShowLogoutConfirm(true);
                            }}
                        >
                            <span className="sidebar-link-icon">⏻</span>
                            <span style={{ fontWeight: 700 }}>Logga ut</span>
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
