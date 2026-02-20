"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

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

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (result?.error) {
            setError("invalid credentials. try again or check with an admin.");
            setLoading(false);
        } else {
            window.location.href = "/spaces";
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card card">
                <div className="auth-title">collab</div>
                <div className="auth-subtitle">
                    private workspace. invite only.
                    <br />
                    <span className="text-muted">{"// authenticate to continue"}</span>
                </div>

                {banned && (
                    <div className="error-text mb-4">
                        access revoked. contact an admin if you think this is a mistake.
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">email</label>
                        <input
                            type="email"
                            className="input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">password</label>
                        <input
                            type="password"
                            className="input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <div className="error-text">{error}</div>}

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg w-full"
                        disabled={loading}
                    >
                        {loading ? "authenticating..." : "login →"}
                    </button>
                </form>

                <div className="auth-footer">
                    no account? you need an invite link from an existing member.
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    );
}
