"use client";

import Link from "next/link";
import { useState } from "react";
import { requestAccess } from "@/lib/actions/access";

export default function LandingPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    const result = await requestAccess(formData);

    if (result.success) {
      setStatus("success");
    } else {
      setStatus("error");
      setErrorMessage(result.error || "Ett fel uppstod.");
    }
  }

  return (
    <div className="landing-page">
      <div className="landing-grid" />
      <div className="landing-noise" />

      <main className="landing-content">
        <div className="landing-badge">
          <span className="status-dot online" /> access handled
        </div>

        <h1 className="landing-title">
          <span className="glitch" data-text="collab">collab</span>
        </h1>

        <div className="manifesto">
          <p className="manifesto-line manifesto-lead">
            Ett rum för fokuserat samarbete.
          </p>
          <p className="manifesto-line text-muted">
            Inte en plattform för alla. En plats för de som bygger.
          </p>
        </div>

        <div className="landing-cta" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
          {status === "success" ? (
            <div className="card p-6 border-l-2 border-l-primary/50 text-center animate-in fade-in duration-500">
              <h3 className="text-lg font-bold text-primary mb-2">Request received.</h3>
              <p className="text-sm text-muted">
                Vi hör av oss om det finns en plats öppen för dig.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card p-6 flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="form-group relative z-10">
                <input
                  type="text"
                  name="name"
                  className="input bg-dark/50 border-subtle focus:border-primary/50 transition-colors"
                  placeholder="Ditt namn"
                  required
                  disabled={status === "loading"}
                />
              </div>
              <div className="form-group relative z-10">
                <input
                  type="email"
                  name="email"
                  className="input bg-dark/50 border-subtle focus:border-primary/50 transition-colors"
                  placeholder="Din e-post"
                  required
                  disabled={status === "loading"}
                />
              </div>

              {status === "error" && (
                <div className="text-danger text-xs text-center border border-danger/20 bg-danger/5 p-2 rounded">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary w-full group relative z-10 overflow-hidden"
                disabled={status === "loading"}
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10">
                  {status === "loading" ? "Skickar..." : "Be om tillgång →"}
                </span>
              </button>

              <div className="text-center mt-2 relative z-10">
                <Link href="/login" className="text-xs text-muted hover:text-primary transition-colors">
                  Redan medlem? Logga in.
                </Link>
              </div>
            </form>
          )}
        </div>

        <div className="landing-footer">
          <span className="text-xs text-muted opacity-50">
            ~/collab — a space for focused work
          </span>
        </div>
      </main>
    </div>
  );
}
