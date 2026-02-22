import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import BackButton from "@/components/back-button";

export default async function SettingsPage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    return (
        <div className="content-area">
            <div className="mb-6">
                <BackButton />
            </div>

            <div className="max-w-2xl mx-auto">
                <h1 className="page-title mb-8">inställningar</h1>

                <div className="card mb-6">
                    <h2 className="text-lg font-bold mb-4">aviseringar</h2>
                    <div className="stack" style={{ gap: "var(--space-4)" }}>
                        <div className="flex items-center justify-between p-3 bg-secondary-alt rounded border border-subtle">
                            <div>
                                <div className="font-semibold">Skrivbordsnotiser</div>
                                <div className="text-xs text-muted">Få aviseringar när webbläsaren är öppen</div>
                            </div>
                            <div className="text-cyan text-xs font-bold">AKTIVERAD</div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-secondary-alt rounded border border-subtle opacity-50">
                            <div>
                                <div className="font-semibold">E-postnotiser</div>
                                <div className="text-xs text-muted">Sammanfattning av missade meddelanden</div>
                            </div>
                            <div className="text-muted text-xs font-bold">KOMMER SNART</div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h2 className="text-lg font-bold mb-4">utseende</h2>
                    <div className="stack" style={{ gap: "var(--space-4)" }}>
                        <div className="flex items-center justify-between p-3 bg-secondary-alt rounded border border-accent">
                            <div>
                                <div className="font-semibold text-accent">Mörkt läge (Standard)</div>
                                <div className="text-xs text-muted text-accent opacity-70">Antigravity Cinematic Design</div>
                            </div>
                            <div className="text-accent">✔</div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-secondary-alt rounded border border-subtle opacity-50">
                            <div>
                                <div className="font-semibold">Ljust läge</div>
                                <div className="text-xs text-muted">Klassisk look</div>
                            </div>
                            <div className="text-muted text-xs font-bold">EJ TILLGÄNGLIGT</div>
                        </div>
                    </div>
                </div>

                <p className="mt-8 text-center text-xs text-muted uppercase tracking-widest">
                    collab v1.0.0-stable
                </p>
            </div>
        </div>
    );
}
