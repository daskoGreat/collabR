"use client";

import React, { useState } from "react";
import { Box } from "@/components/layout/Box";
import { Stack } from "@/components/layout/Stack";
import { Typography } from "@/components/ui/typography";
import { X } from "lucide-react";
import { BRANDED_AVATARS } from "./BrandedIcons";

interface AvatarModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (avatarId: string) => void;
    currentAvatarId?: string;
}

export function AvatarModal({ isOpen, onClose, onSelect, currentAvatarId }: AvatarModalProps) {
    if (!isOpen) return null;

    return (
        <Box style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            padding: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000
        }}>
            <div
                onClick={onClose}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.85)',
                    backdropFilter: 'blur(12px)',
                    animation: 'fade-in 0.3s ease-out'
                }}
            />

            <Box style={{
                background: '#111111',
                width: '100%',
                maxWidth: '600px',
                borderRadius: '32px',
                padding: '2.5rem',
                position: 'relative',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 30px 60px -12px rgba(0,0,0,0.5)',
                animation: 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                zIndex: 1
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1.5rem',
                        right: '1.5rem',
                        background: 'rgba(255,255,255,0.05)',
                        border: 'none',
                        color: 'rgba(255,255,255,0.6)',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                    className="hover:bg-white hover:text-black"
                >
                    <X size={18} />
                </button>

                <Stack direction="vertical" gap={12} style={{ marginBottom: '2.5rem' }}>
                    <Typography style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-outfit)', color: '#ffffff' }}>
                        Choose your avatar
                    </Typography>
                    <Typography style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', lineHeight: 1.5 }}>
                        Select the icon that represents you in The Support Network.
                    </Typography>
                </Stack>

                <Box className="avatar-selection-grid">
                    {BRANDED_AVATARS.map((avatar) => (
                        <Box
                            key={avatar.id}
                            onClick={() => {
                                onSelect(avatar.id);
                                onClose();
                            }}
                            style={{
                                aspectRatio: '1/1',
                                background: currentAvatarId === avatar.id ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                                border: `2px solid ${currentAvatarId === avatar.id ? '#ffffff' : 'rgba(255,255,255,0.03)'}`,
                                borderRadius: '24px',
                                padding: '1.25rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            className="avatar-option-card"
                        >
                            {avatar.icon(currentAvatarId === avatar.id ? "#ffffff" : "rgba(255,255,255,0.4)")}
                            {currentAvatarId === avatar.id && (
                                <Box style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px',
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: '#ffffff',
                                    boxShadow: '0 0 10px #ffffff'
                                }} />
                            )}
                        </Box>
                    ))}
                </Box>
            </Box>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(20px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .avatar-selection-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1rem;
                    max-height: 480px;
                    overflow-y: auto;
                    padding-right: 8px;
                }
                @media (max-width: 640px) {
                    .avatar-selection-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
                @media (min-width: 641px) and (max-width: 800px) {
                    .avatar-selection-grid {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }
                .avatar-selection-grid::-webkit-scrollbar {
                    width: 4px;
                }
                .avatar-selection-grid::-webkit-scrollbar-track {
                    background: transparent;
                }
                .avatar-selection-grid::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.1);
                    border-radius: 10px;
                }
                .avatar-option-card:hover {
                    transform: translateY(-4px);
                    background: rgba(255,255,255,0.08) !important;
                    border-color: rgba(255,255,255,0.2) !important;
                    box-shadow: 0 10px 20px -5px rgba(0,0,0,0.4);
                }
                .avatar-option-card:hover svg {
                    color: #ffffff !important;
                    stroke: #ffffff !important;
                }
                .avatar-option-card:active {
                    transform: scale(0.95);
                }
            `}} />
        </Box>
    );
}
