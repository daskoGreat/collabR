"use client";

import { Box } from "@/components/layout/Box";
import { Stack } from "@/components/layout/Stack";
import { Typography } from "@/components/ui/typography";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description: string;
    action?: React.ReactNode;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action
}: EmptyStateProps) {
    return (
        <Box style={{
            padding: "4rem 2rem",
            textAlign: "center",
            background: "rgba(255,255,255,0.02)",
            borderRadius: "32px",
            border: "1px dashed rgba(255,255,255,0.1)",
            maxWidth: "600px",
            margin: "2rem auto"
        }}>
            <Stack direction="vertical" gap={16} align="center">
                {Icon && (
                    <Box style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "20px",
                        background: "rgba(255,255,255,0.05)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "8px"
                    }}>
                        <Icon size={32} style={{ color: "rgba(255,255,255,0.3)" }} />
                    </Box>
                )}
                <Typography style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff" }}>
                    {title}
                </Typography>
                <Typography style={{ fontSize: "1rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                    {description}
                </Typography>
                {action && (
                    <Box style={{ marginTop: "1rem" }}>
                        {action}
                    </Box>
                )}
            </Stack>
        </Box>
    );
}
