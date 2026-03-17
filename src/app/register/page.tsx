"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { Typography } from "@/components/ui/typography";
import { Box } from "@/components/layout/Box";
import { selfRegister } from "@/lib/actions/register";

const CATEGORIES = [
    { id: "community", label: "Community" },
    { id: "coaching", label: "Coaching" },
    { id: "psychological", label: "Psychological" },
    { id: "spiritual", label: "Spiritual" }
];

export default function RegistrationPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validatePassword = (pass: string) => {
        if (pass.length < 8) return "Password must be at least 8 characters";
        if (!/[A-Z]/.test(pass)) return "Password must contain at least one uppercase letter";
        if (!/[0-9]/.test(pass)) return "Password must contain at least one number";
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name || !username || !email || !password || !confirmPassword || !selectedCategory) {
            setError("Please fill in all fields");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        const passError = validatePassword(password);
        if (passError) {
            setError(passError);
            return;
        }

        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("username", username);
            formData.append("email", email);
            formData.append("password", password);
            formData.append("category", selectedCategory);

            const result = await selfRegister(formData);
            if (result.success) {
                // Redirect directly to avatar onboarding
                window.location.href = "/register/avatar";
            } else if (result.error) {
                setError(result.error);
            }
        } catch (error) {
            console.error("Registration failed:", error);
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box style={{
            minHeight: '100vh',
            background: '#000000',
            color: '#ffffff',
            padding: '6rem 2rem'
        }}>
            <Container style={{ maxWidth: '1000px' }}>
                <Stack direction="vertical" gap={80}>

                    {/* Header */}
                    <Box style={{ marginBottom: '2rem' }}>
                        <Typography style={{
                            fontSize: 'min(4.5rem, 9vw)',
                            fontWeight: 700,
                            lineHeight: 1.1,
                            fontFamily: 'var(--font-outfit)',
                            color: '#ffffff'
                        }}>
                            Tell us a little bit about why you are here.<br />
                            This way we can help you better. <img src="/heart.png" alt="Heart" style={{ width: '1.2em', height: '1.2em', display: 'inline-block', verticalAlign: 'text-bottom', marginLeft: '0.5rem' }} />
                        </Typography>
                    </Box>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <Stack direction="vertical" gap={48}>

                            {error && (
                                <Box style={{
                                    padding: '1.5rem',
                                    background: 'rgba(255, 50, 50, 0.1)',
                                    border: '1px solid rgba(255, 50, 50, 0.3)',
                                    borderRadius: '16px',
                                    color: '#ff8888',
                                    fontWeight: 600
                                }}>
                                    {error}
                                </Box>
                            )}

                            <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <Stack direction="vertical" gap="md">
                                    <Typography style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-inter)', color: '#ffffff' }}>
                                        Display Name
                                    </Typography>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="your public name"
                                        style={inputStyle}
                                    />
                                </Stack>

                                <Stack direction="vertical" gap="md">
                                    <Typography style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-inter)', color: '#ffffff' }}>
                                        Username
                                    </Typography>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="unique_id"
                                        style={inputStyle}
                                    />
                                </Stack>
                            </Box>

                            <Stack direction="vertical" gap="md">
                                <Typography style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-inter)', color: '#ffffff' }}>
                                    Email
                                </Typography>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    style={{ ...inputStyle, maxWidth: 'none' }}
                                />
                            </Stack>

                            <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <Stack direction="vertical" gap="md">
                                    <Typography style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-inter)', color: '#ffffff' }}>
                                        Password
                                    </Typography>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        style={inputStyle}
                                    />
                                </Stack>

                                <Stack direction="vertical" gap="md">
                                    <Typography style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-inter)', color: '#ffffff' }}>
                                        Confirm Password
                                    </Typography>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        style={inputStyle}
                                    />
                                </Stack>
                            </Box>

                            <Stack direction="vertical" gap="xl" style={{ marginTop: '2rem' }}>
                                <Typography style={{
                                    fontSize: '1.75rem',
                                    fontWeight: 600,
                                    fontFamily: 'var(--font-inter)',
                                    color: '#ffffff'
                                }}>
                                    What type of support are you mainly looking for?
                                </Typography>

                                <Box style={{
                                    display: 'flex',
                                    gap: '3rem',
                                    flexWrap: 'wrap',
                                    marginTop: '1rem'
                                }}>
                                    {CATEGORIES.map((cat) => (
                                        <Box
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat.id)}
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '1.5rem',
                                                cursor: 'pointer',
                                                width: '160px'
                                            }}
                                        >
                                            <Box style={{
                                                width: '80px',
                                                height: '80px',
                                                borderRadius: '50%',
                                                border: `2px solid ${selectedCategory === cat.id ? '#ffffff' : 'rgba(255,255,255,0.2)'}`,
                                                background: selectedCategory === cat.id ? '#ffffff' : 'transparent',
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }} />
                                            <Typography style={{
                                                fontSize: '1.25rem',
                                                fontWeight: 600,
                                                color: selectedCategory === cat.id ? '#ffffff' : 'rgba(255,255,255,0.6)',
                                                fontFamily: 'var(--font-inter)'
                                            }}>
                                                {cat.label}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Stack>

                            <Box style={{ marginTop: '5rem' }}>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    style={{
                                        background: '#1a1a1a',
                                        color: '#ffffff',
                                        border: '1px solid rgba(255,255,255,0.3)',
                                        padding: '1.25rem 5rem',
                                        borderRadius: '9999px',
                                        fontSize: '2.5rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        opacity: isLoading ? 0.3 : 1,
                                        fontFamily: 'var(--font-outfit)'
                                    }}
                                    className="hover:bg-white hover:text-black"
                                >
                                    {isLoading ? "loading..." : "continue →"}
                                </button>
                            </Box>

                        </Stack>
                    </form>

                </Stack>
            </Container>
        </Box>
    );
}

const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '9999px',
    padding: '1.5rem 2.5rem',
    color: '#ffffff',
    fontSize: '1.25rem',
    outline: 'none',
    fontFamily: 'var(--font-inter)'
};
