"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { User as UserIcon, Palette, Settings, Sun, Moon, LogOut, ChevronDown } from "lucide-react";
import { Stack } from "./layout/Stack";
import { Box } from "./layout/Box";
import { Typography } from "./ui/typography";
import LogoutConfirmation from "./logout-confirmation";
import { AvatarPreview } from "./avatar-builder/AvatarPreview";

interface Props {
    user: { id: string; name: string; email: string; role: string; avatarId?: string };
}

export default function UserMenu({ user }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { setTheme, resolvedTheme } = useTheme();
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

    if (!mounted) return null;

    return (
        <div className="user-menu-container" ref={menuRef} style={{ position: "relative" }}>
            <button
                className="user-menu-trigger"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="User menu"
                style={{
                    background: 'none',
                    border: 'none',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    borderRadius: '9999px',
                    transition: 'all 0.2s',
                    color: 'rgba(255,255,255,0.4)',
                    outline: 'none'
                }}
            >
                <AvatarPreview avatarId={user.avatarId} name={user.name} size="sm" />
                <ChevronDown
                    size={12}
                    style={{
                        transition: 'transform 0.3s var(--ease-out)',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        opacity: 0.5
                    }}
                />
            </button>

            {isOpen && (
                <Box style={{
                    position: "absolute",
                    top: "calc(100% + 12px)",
                    right: 0,
                    minWidth: "240px",
                    zIndex: 1000,
                    background: "#121212",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: '20px',
                    boxShadow: "0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)",
                    animation: "fadeIn 0.3s var(--ease-out)",
                    padding: '6px',
                    overflow: 'hidden'
                }}>
                    <Box style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: '4px' }}>
                        <Typography style={{ fontSize: "0.85rem", fontWeight: 800, color: '#fff', marginBottom: '2px' }}>
                            {user.name.toLowerCase()}
                        </Typography>
                        <Typography style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>
                            {user.email}
                        </Typography>
                    </Box>

                    <Stack gap={2}>
                        <Link href="/profile" onClick={() => setIsOpen(false)}>
                            <Stack direction="horizontal" gap={12} align="center" className="user-menu-item" style={{ padding: '10px 14px', borderRadius: '12px', transition: 'all 0.2s' }}>
                                <UserIcon size={16} style={{ opacity: 0.4 }} />
                                <Typography style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>profil</Typography>
                            </Stack>
                        </Link>
                        <Link href="/avatar" onClick={() => setIsOpen(false)}>
                            <Stack direction="horizontal" gap={12} align="center" className="user-menu-item" style={{ padding: '10px 14px', borderRadius: '12px', transition: 'all 0.2s' }}>
                                <Palette size={16} style={{ opacity: 0.4 }} />
                                <Typography style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>byt avatar</Typography>
                            </Stack>
                        </Link>
                        <Link href="/settings" onClick={() => setIsOpen(false)}>
                            <Stack direction="horizontal" gap={12} align="center" className="user-menu-item" style={{ padding: '10px 14px', borderRadius: '12px', transition: 'all 0.2s' }}>
                                <Settings size={16} style={{ opacity: 0.4 }} />
                                <Typography style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>inställningar</Typography>
                            </Stack>
                        </Link>

                        <Box style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "4px 8px" }} />

                        <button
                            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                            style={{ background: 'none', border: 'none', width: '100%', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                        >
                            <Stack direction="horizontal" gap={12} align="center" className="user-menu-item" style={{ padding: '10px 14px', borderRadius: '12px', transition: 'all 0.2s' }}>
                                {resolvedTheme === "dark" ? <Sun size={16} style={{ opacity: 0.4 }} /> : <Moon size={16} style={{ opacity: 0.4 }} />}
                                <Typography style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                                    {resolvedTheme === "dark" ? "ljust läge" : "mörkt läge"}
                                </Typography>
                            </Stack>
                        </button>

                        <Box style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "4px 8px" }} />

                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setShowLogoutConfirm(true);
                            }}
                            style={{ background: 'none', border: 'none', width: '100%', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                        >
                            <Stack direction="horizontal" gap={12} align="center" className="user-menu-item-danger" style={{ padding: '10px 14px', borderRadius: '12px', transition: 'all 0.2s' }}>
                                <LogOut size={16} style={{ opacity: 0.6 }} />
                                <Typography style={{ fontSize: '0.85rem', color: 'inherit', fontWeight: 800 }}>logga ut</Typography>
                            </Stack>
                        </button>
                    </Stack>
                </Box>
            )}

            <LogoutConfirmation
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={() => signOut({ callbackUrl: "/login" })}
            />

            <style dangerouslySetInnerHTML={{
                __html: `
                .user-menu-trigger:hover {
                    background: rgba(255,255,255,0.03) !important;
                }
                .user-menu-item:hover {
                    background: rgba(255,255,255,0.05) !important;
                }
                .user-menu-item:hover Typography {
                    color: #fff !important;
                }
                .user-menu-item-danger {
                    color: #ff4d4d;
                }
                .user-menu-item-danger:hover {
                    background: rgba(255, 77, 77, 0.1) !important;
                    color: #ff3333;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}} />
        </div>
    );
}
