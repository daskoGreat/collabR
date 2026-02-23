"use client";

import { useState } from "react";
import { approveRequest, denyRequest } from "@/lib/actions/join-requests";

interface Request {
    id: string;
    name: string;
    email: string;
    message: string | null;
    status: "PENDING" | "APPROVED" | "DENIED";
    createdAt: string;
}

export default function RequestsAdmin({ initialRequests }: { initialRequests: Request[] }) {
    const [requests, setRequests] = useState<Request[]>(initialRequests);
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
    const [generatedInvites, setGeneratedInvites] = useState<Record<string, string>>({});

    async function handleApprove(id: string) {
        setLoadingMap(prev => ({ ...prev, [id]: true }));
        try {
            const result = await approveRequest(id);
            if (result.success && result.inviteUrl) {
                setGeneratedInvites(prev => ({ ...prev, [id]: result.inviteUrl! }));
                setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "APPROVED" } : r));
            } else {
                alert(result.error || "Failed to approve request.");
            }
        } finally {
            setLoadingMap(prev => ({ ...prev, [id]: false }));
        }
    }

    async function handleDeny(id: string) {
        if (!confirm("Are you sure you want to deny this request?")) return;

        setLoadingMap(prev => ({ ...prev, [id]: true }));
        try {
            const result = await denyRequest(id);
            if (result.success) {
                setRequests(prev => prev.filter(r => r.id !== id));
            } else {
                alert(result.error || "Failed to deny request.");
            }
        } finally {
            setLoadingMap(prev => ({ ...prev, [id]: false }));
        }
    }

    async function handleCopy(url: string) {
        try {
            await navigator.clipboard.writeText(url);
            alert("Invite link copied to clipboard!");
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    }

    if (requests.length === 0) {
        return (
            <div className="card p-8 text-center text-muted">
                <p>Inga väntande ansökningar just nu.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold section-title mb-4">Pending Access Requests</h2>

            <div className="grid grid-cols-1 gap-4">
                {requests.map(request => (
                    <div key={request.id} className="card p-6 border-l-2 border-l-primary/30 flex flex-col md:flex-row gap-6 md:items-center">
                        <div className="flex-1">
                            <h3 className="text-lg font-bold mb-1">{request.name}</h3>
                            <a href={`mailto:${request.email}`} className="text-sm text-cyan hover:underline">{request.email}</a>

                            {request.message && (
                                <div className="mt-4 p-4 bg-dark/30 rounded border border-border-subtle text-sm text-muted">
                                    <strong className="block mb-2 text-xs text-secondary uppercase tracking-wider">Message</strong>
                                    {request.message}
                                </div>
                            )}

                            <div className="mt-2 text-xs text-muted opacity-50">
                                Applied: {new Date(request.createdAt).toLocaleString("sv-SE")}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 min-w-[200px]">
                            {request.status === "PENDING" && !generatedInvites[request.id] ? (
                                <>
                                    <button
                                        className="btn btn-primary w-full shadow-neon"
                                        onClick={() => handleApprove(request.id)}
                                        disabled={loadingMap[request.id]}
                                    >
                                        {loadingMap[request.id] ? "Processing..." : "Approve & Generate Invite"}
                                    </button>
                                    <button
                                        className="btn btn-ghost text-danger w-full"
                                        onClick={() => handleDeny(request.id)}
                                        disabled={loadingMap[request.id]}
                                    >
                                        Deny Request
                                    </button>
                                </>
                            ) : (
                                <div className="bg-success/10 border border-success/30 p-4 rounded text-center">
                                    <div className="text-success text-sm font-bold mb-2">Approved!</div>
                                    <button
                                        className="btn btn-sm btn-outline w-full text-xs"
                                        onClick={() => handleCopy(generatedInvites[request.id])}
                                    >
                                        Copy Invite Link
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
