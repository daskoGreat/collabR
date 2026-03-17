"use client";

import { Box } from "@/components/layout/Box";
import { Typography } from "@/components/ui/typography";
import { getBrandedAvatar } from "./BrandedIcons";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | number;

interface AvatarPreviewProps {
    avatarId?: string;
    name?: string;
    accentColor?: string;
    backgroundColor?: string;
    size?: AvatarSize;
}

const SIZE_MAP: Record<string, number> = {
    xs: 24,
    sm: 32,
    md: 48,
    lg: 88,
    xl: 128
};

export function AvatarPreview({
    avatarId = "default",
    name = "",
    accentColor = "#ffffff",
    backgroundColor = "rgba(255,255,255,0.05)",
    size = "md"
}: AvatarPreviewProps) {
    const pixelSize = typeof size === "number" ? size : SIZE_MAP[size] || 48;

    // If avatarId looks like a URL, it's an uploaded avatar or library avatar
    const isUrl = avatarId?.startsWith('http') || avatarId?.startsWith('/') || avatarId?.includes('.');

    const getInitials = () => {
        if (!name) return "?";
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <Box style={{
            width: pixelSize,
            height: pixelSize,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: backgroundColor,
            borderRadius: '50%',
            overflow: 'hidden',
            aspectRatio: '1/1',
            border: '1px solid rgba(255,255,255,0.1)',
            position: 'relative',
            flexShrink: 0
        }}>
            {isUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={avatarId}
                    alt={name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            ) : avatarId && avatarId !== "default" && avatarId !== "" ? (
                <Box style={{ padding: '15%', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getBrandedAvatar(avatarId).icon(accentColor)}
                </Box>
            ) : (
                <Typography style={{
                    fontSize: `${pixelSize * 0.4}px`,
                    fontWeight: 700,
                    color: accentColor,
                    opacity: 0.8,
                    lineHeight: 1
                }}>
                    {getInitials()}
                </Typography>
            )}
        </Box>
    );
}
