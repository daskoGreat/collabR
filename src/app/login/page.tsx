"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Box } from "@/components/layout/Box";

function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const searchParams = useSearchParams();
    const banned = searchParams.get("error") === "banned";

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid email or password.");
                setLoading(false);
            } else {
                // Redirect to the support network portal
                window.location.href = "/network";
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    }

    return (
        <Box style={{ minHeight: '100vh', background: '#000000', color: '#ffffff' }}>
            <Container style={{ maxWidth: '600px' }}>
                <Stack direction="vertical" align="center" justify="center" gap={64} style={{ minHeight: '100vh' }}>

                    <Stack direction="vertical" gap={16} align="center">
                        <Typography style={{
                            fontSize: '3rem',
                            fontWeight: 700,
                            fontFamily: 'var(--font-outfit)',
                            textAlign: 'center'
                        }}>
                            The Support Network
                        </Typography>
                        <Typography style={{
                            fontSize: '1.25rem',
                            color: 'rgba(255,255,255,0.6)',
                            fontFamily: 'var(--font-inter)',
                            textAlign: 'center'
                        }}>
                            Welcome back. Please sign in to continue.
                        </Typography>
                    </Stack>

                    <Box style={{ width: '100%' }}>
                        <form onSubmit={handleSubmit}>
                            <Stack direction="vertical" gap={32}>
                                {banned && (
                                    <Box style={{ padding: '1.5rem', background: 'rgba(255, 50, 50, 0.1)', border: '1px solid rgba(255, 50, 50, 0.3)', borderRadius: '16px', color: '#ff8888', fontWeight: 600 }}>
                                        Access revoked. Contact an admin.
                                    </Box>
                                )}

                                {error && (
                                    <Box style={{ padding: '1.5rem', background: 'rgba(255, 50, 50, 0.1)', border: '1px solid rgba(255, 50, 50, 0.3)', borderRadius: '16px', color: '#ff8888', fontWeight: 600 }}>
                                        {error}
                                    </Box>
                                )}

                                <Stack direction="vertical" gap={24}>
                                    <Stack direction="vertical" gap={8}>
                                        <Typography style={{ fontWeight: 600, fontSize: '1.1rem' }}>Email</Typography>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="your@email.com"
                                            required
                                            style={inputStyle}
                                        />
                                    </Stack>
                                    <Stack direction="vertical" gap={8}>
                                        <Typography style={{ fontWeight: 600, fontSize: '1.1rem' }}>Password</Typography>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            style={inputStyle}
                                        />
                                    </Stack>
                                </Stack>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        background: '#ffffff',
                                        color: '#000000',
                                        padding: '1.25rem',
                                        borderRadius: '9999px',
                                        fontSize: '1.5rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        opacity: loading ? 0.3 : 1,
                                        fontFamily: 'var(--font-outfit)'
                                    }}
                                    className="hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {loading ? "Signing in..." : "Login →"}
                                </button>
                            </Stack>
                        </form>

                        <Box style={{ textAlign: 'center', marginTop: '3rem' }}>
                            <Typography style={{ color: 'rgba(255,255,255,0.4)' }}>
                                Don't have an account? <Link href="/register" style={{ color: '#ffffff', textDecoration: 'underline' }}>Register here</Link>.
                            </Typography>
                        </Box>
                    </Box>

                </Stack>
            </Container>
        </Box>
    );
}

const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '16px',
    padding: '1.25rem 1.5rem',
    color: '#ffffff',
    fontSize: '1.1rem',
    outline: 'none',
    fontFamily: 'var(--font-inter)'
};

export default function LoginPage() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    );
}
