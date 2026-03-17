import React from "react";
import Link from "next/link";
import { Container } from "./Container";
import { Box } from "./Box";
import { Typography } from "../ui/typography";
import { ChevronLeft } from "lucide-react";

interface SupportLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    backHref?: string;
}

export const SupportLayout: React.FC<SupportLayoutProps> = ({
    children,
    title,
    subtitle,
    backHref = "/network",
}) => {
    return (
        <Box
            style={{
                minHeight: "100vh",
                background: "#0e0f11",
                color: "#ffffff",
                padding: "2rem 1rem",
                fontFamily: "var(--font-inter)",
            }}
        >
            <Container style={{ maxWidth: "1200px" }}>
                <Box style={{ marginBottom: "3rem" }}>
                    <Link
                        href={backHref}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            color: "rgba(255,255,255,0.6)",
                            textDecoration: "none",
                            marginBottom: "2rem",
                            transition: "color 0.2s",
                        }}
                        className="hover:text-white"
                    >
                        <ChevronLeft size={20} />
                        <Typography style={{ fontSize: "1rem", fontWeight: 500 }}>
                            Back to Portal
                        </Typography>
                    </Link>

                    <Typography
                        style={{
                            fontSize: "min(3.5rem, 8vw)",
                            fontWeight: 700,
                            fontFamily: "var(--font-outfit)",
                            lineHeight: 1.1,
                            marginBottom: "0.5rem",
                        }}
                    >
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography
                            style={{
                                fontSize: "1.25rem",
                                color: "rgba(255,255,255,0.7)",
                                fontFamily: "var(--font-inter)",
                                maxWidth: "600px",
                            }}
                        >
                            {subtitle}
                        </Typography>
                    )}
                </Box>

                <Box>{children}</Box>
            </Container>
        </Box>
    );
};
