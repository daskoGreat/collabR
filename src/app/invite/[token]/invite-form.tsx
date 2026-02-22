"use client";

import { useState } from "react";
import { registerWithInvite } from "@/lib/actions/invites";

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
        <form className="auth-form" action={handleSubmit}>
            <div className="form-group">
                <label className="form-label">name</label>
                <input
                    type="text"
                    name="name"
                    className="input"
                    placeholder="what should we call you?"
                    defaultValue={prefill?.name || ""}
                    readOnly={!!prefill?.name}
                    required
                    autoFocus={!prefill?.name}
                />
            </div>

            <div className="form-group">
                <label className="form-label">email</label>
                <input
                    type="email"
                    name="email"
                    className="input"
                    placeholder="you@example.com"
                    defaultValue={prefill?.email || ""}
                    readOnly={!!prefill?.email}
                    required
                />
            </div>

            <div className="form-group">
                <label className="form-label">password</label>
                <input
                    type="password"
                    name="password"
                    className="input"
                    placeholder="min 8 characters"
                    minLength={8}
                    required
                />
            </div>

            {error && <div className="error-text">{error}</div>}

            <button
                type="submit"
                className="btn btn-primary btn-lg w-full"
                disabled={loading}
            >
                {loading ? "creating account..." : "join workspace →"}
            </button>
        </form>
    );
}
