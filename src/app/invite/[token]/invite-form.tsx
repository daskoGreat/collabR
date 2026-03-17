"use client";

import { useState } from "react";
import { registerWithInvite } from "@/lib/actions/invites";
import { Stack } from "@/components/layout/Stack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";

export default function InviteForm({
    token,
    prefill
}: {
    token: string;
    prefill?: { name: string; email: string } | null;
}) {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError("");
        formData.set("token", token);

        const result = await registerWithInvite(formData);
        if (result?.error) {
            setError(result.error);
            setLoading(false);
        }
    }

    return (
        <form action={handleSubmit}>
            <Stack direction="vertical" gap="md">
                <Input
                    label="Name"
                    name="name"
                    placeholder="What should we call you?"
                    defaultValue={prefill?.name || ""}
                    readOnly={!!prefill?.name}
                    required
                    autoFocus={!prefill?.name}
                />

                <Input
                    label="Email"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    defaultValue={prefill?.email || ""}
                    readOnly={!!prefill?.email}
                    required
                />

                <Input
                    label="Password"
                    type="password"
                    name="password"
                    placeholder="Min 8 characters"
                    minLength={8}
                    required
                />

                {error && (
                    <Typography variant="caption" style={{ color: 'var(--accent-danger)', textAlign: 'center' }}>
                        {error}
                    </Typography>
                )}

                <Button
                    type="submit"
                    disabled={loading}
                    size="lg"
                    style={{ marginTop: 'var(--space-md)' }}
                >
                    {loading ? "Creating account..." : "Join network →"}
                </Button>
            </Stack>
        </form>
    );
}
