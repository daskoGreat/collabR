"use client";

import { useState, useEffect } from "react";
import { approveRequest, denyRequest } from "@/lib/actions/join-requests";
import { getPusherClient } from "@/lib/pusher-client";
import { Stack } from "@/components/layout/Stack";
import { Box } from "@/components/layout/Box";
import { Typography } from "@/components/ui/typography";
import { EmptyState } from "@/components/ui/EmptyState";
import { UserCheck, UserX, Mail, MessageSquare, Clock, Globe, Shield, Copy, CheckCircle } from "lucide-react";

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
    const [pusherConnected, setPusherConnected] = useState(false);

    useEffect(() => {
        console.log("Subscribing to Pusher channel 'admin'...");
        const pusher = getPusherClient();
        const channel = pusher.subscribe("admin");

        channel.bind("pusher:subscription_succeeded", () => {
            console.log("Pusher subscription to 'admin' succeeded");
            setPusherConnected(true);
        });

        channel.bind("pusher:subscription_error", (err: any) => {
            console.error("Pusher subscription error:", err);
            setPusherConnected(false);
        });

        channel.bind("new-join-request", (newRequest: Request) => {
            console.log("Received new-join-request via Pusher:", newRequest);
            setRequests(prev => {
                if (prev.some(r => r.id === newRequest.id)) return prev;
                return [newRequest, ...prev];
            });
        });

        return () => {
            console.log("Unsubscribing from Pusher channel 'admin'");
            pusher.unsubscribe("admin");
        };
    }, []);

    async function handleApprove(id: string) {
        setLoadingMap(prev => ({ ...prev, [id]: true }));
        try {
            const result = await approveRequest(id);
            if (result.success && result.inviteUrl) {
                setGeneratedInvites(prev => ({ ...prev, [id]: result.inviteUrl! }));
                setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "APPROVED" } : r));

                if (result.emailError) {
                    alert(`Approved, but email failed: ${result.emailError}. Link generated for manual copy.`);
                } else if (result.message) {
                    // Show message (Optional alert, or just toast-like feedback)
                    console.log(result.message);
                }
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

    return (
        <Box style={{ background: "rgba(255,255,255,0.02)", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
            <Box style={{ padding: "2rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <Stack direction="horizontal" justify="between" align="center">
                    <Box>
                        <Typography style={{ fontSize: "1.25rem", fontWeight: 700 }}>Medlemsansökningar</Typography>
                        <Typography style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>
                            {requests.filter(r => r.status === "PENDING").length} väntande förfrågningar
                        </Typography>
                    </Box>
                    <div style={{ padding: "4px 12px", background: pusherConnected ? "rgba(0,255,163,0.1)" : "rgba(255,255,255,0.05)", borderRadius: "20px", border: "1px solid", borderColor: pusherConnected ? "rgba(0,255,163,0.2)" : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: pusherConnected ? "var(--neon-green)" : "rgba(255,255,255,0.2)", animation: pusherConnected ? "pulse 2s infinite" : "none" }} />
                        <Typography style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", color: pusherConnected ? "var(--neon-green)" : "rgba(255,255,255,0.3)" }}>
                            {pusherConnected ? "LIVE" : "OFFLINE"}
                        </Typography>
                    </div>
                </Stack>
            </Box>

            {requests.length === 0 ? (
                <Box style={{ padding: "4rem 2rem" }}>
                    <EmptyState
                        icon={UserCheck}
                        title="Inga nya ansökningar"
                        description="Det finns inga väntande medlemsansökningar för tillfället."
                    />
                </Box>
            ) : (
                <Box style={{ padding: "2rem" }}>
                    <Stack gap={16}>
                        {requests.map(request => (
                            <Box key={request.id} style={{ padding: "1.5rem", background: "rgba(255,255,255,0.03)", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.08)" }}>
                                <Stack direction="horizontal" justify="between" align="start" gap={24}>
                                    <Stack gap={16} style={{ flex: 1 }}>
                                        <Box>
                                            <Typography style={{ fontSize: "1.1rem", fontWeight: 700, color: "white", marginBottom: "4px" }}>{request.name.toLowerCase()}</Typography>
                                            <Stack direction="horizontal" gap={8} align="center">
                                                <Mail size={12} style={{ color: "var(--neon-cyan)" }} />
                                                <Typography style={{ fontSize: "0.85rem", color: "var(--neon-cyan)" }}>{request.email}</Typography>
                                            </Stack>
                                        </Box>

                                        {request.message && (
                                            <Box style={{ padding: "1rem", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                                                <Stack direction="horizontal" gap={8} align="center" style={{ marginBottom: "8px" }}>
                                                    <MessageSquare size={12} style={{ color: "rgba(255,255,255,0.3)" }} />
                                                    <Typography style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>Meddelande</Typography>
                                                </Stack>
                                                <Typography style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
                                                    {request.message}
                                                </Typography>
                                            </Box>
                                        )}

                                        <Stack direction="horizontal" gap={12} align="center">
                                            <Clock size={12} style={{ color: "rgba(255,255,255,0.2)" }} />
                                            <Typography style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>
                                                Ansökte {new Date(request.createdAt).toLocaleString("sv-SE")}
                                            </Typography>
                                        </Stack>
                                    </Stack>

                                    <Box style={{ minWidth: "220px" }}>
                                        {request.status === "PENDING" && !generatedInvites[request.id] ? (
                                            <Stack gap={8}>
                                                <button
                                                    className="btn btn-primary w-full"
                                                    onClick={() => handleApprove(request.id)}
                                                    disabled={loadingMap[request.id]}
                                                >
                                                    {loadingMap[request.id] ? "Hanterar..." : "Godkänn ansökan"}
                                                </button>
                                                <button
                                                    className="btn btn-ghost w-full"
                                                    onClick={() => handleDeny(request.id)}
                                                    disabled={loadingMap[request.id]}
                                                    style={{ color: "var(--accent-danger)" }}
                                                >
                                                    Avböj
                                                </button>
                                            </Stack>
                                        ) : (
                                            <Box style={{ padding: "1rem", background: "rgba(0,255,163,0.05)", border: "1px solid rgba(0,255,163,0.1)", borderRadius: "16px", textAlign: "center" }}>
                                                <Typography style={{ color: "var(--neon-green)", fontWeight: 700, fontSize: "0.85rem", marginBottom: "12px" }}>BEVILJAD</Typography>
                                                <button
                                                    className="btn btn-ghost btn-sm w-full"
                                                    onClick={() => handleCopy(generatedInvites[request.id])}
                                                    style={{ color: "var(--neon-green)", background: "rgba(0,255,163,0.1)" }}
                                                >
                                                    <Copy size={12} style={{ marginRight: "6px" }} />
                                                    Kopiera länk
                                                </button>
                                            </Box>
                                        )}
                                    </Box>
                                </Stack>
                            </Box>
                        ))}
                    </Stack>
                </Box>
            )}
        </Box>
    );
}
