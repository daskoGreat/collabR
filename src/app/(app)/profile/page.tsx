import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import BackButton from "@/components/back-button";

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    const { user } = session;
    const initial = user.name?.charAt(0).toUpperCase() || "?";

    return (
        <div className="content-area">
            <div className="mb-6">
                <BackButton />
            </div>

            <div className="max-w-2xl mx-auto">
                <h1 className="page-title mb-8">din profil</h1>

                <div className="card">
                    <div className="flex items-center gap-6 mb-8 pb-8 border-b border-subtle">
                        <div
                            className="sidebar-user-avatar"
                            style={{ width: "80px", height: "80px", fontSize: "2rem" }}
                        >
                            {initial}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{user.name}</h2>
                            <p className="text-muted">{user.email}</p>
                            <div className="tag mt-2">{(user as any).role?.toLowerCase() || "medlem"}</div>
                        </div>
                    </div>

                    <div className="stack" style={{ gap: "var(--space-4)" }}>
                        <div>
                            <label className="text-xs text-muted uppercase tracking-wider mb-1 block">namn</label>
                            <div className="input bg-secondary-alt border-none cursor-not-allowed">
                                {user.name}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-muted uppercase tracking-wider mb-1 block">e-post</label>
                            <div className="input bg-secondary-alt border-none cursor-not-allowed">
                                {user.email}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-muted uppercase tracking-wider mb-1 block">roll</label>
                            <div className="input bg-secondary-alt border-none cursor-not-allowed text-cyan">
                                {(user as any).role?.toLowerCase() || "medlem"}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-subtle">
                        <p className="text-sm text-muted italic">
                            Profilredigering är låst av din organisation. Kontakta en administratör vid ändringar.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
