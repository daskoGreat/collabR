"use client";

import { useState } from "react";
import { createInvite, revokeInvite, reinviteUser } from "@/lib/actions/admin";

interface Invite {
    id: string;
    token: string;
    email: string | null;
    createdBy: string;
    creatorAvatarId?: string;
    maxUses: number;
    uses: number;
    singleUse: boolean;
    expiresAt: string | null;
    revoked: boolean;
    createdAt: string;
    isRegistered: boolean;
}

import { AvatarPreview } from "@/components/avatar-builder/AvatarPreview";
import { Stack } from "@/components/layout/Stack";
import { Box } from "@/components/layout/Box";
import { Typography } from "@/components/ui/typography";
import { Copy, RefreshCw, XCircle, Mail, Globe, CheckCircle, Clock } from "lucide-react";

interface Props {
    invites: Invite[];
}

export default function InvitesAdmin({ invites }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newToken, setNewToken] = useState<string | null>(null);

    async function handleCreate(formData: FormData) {
        setCreating(true);
        const result = await createInvite(formData);
        if (result?.token) {
            setNewToken(result.token);
        }
        setCreating(false);
        setShowCreate(false);
    }

    async function handleReinvite(email: string) {
        const result = await reinviteUser(email);
        if (result?.token) {
            setNewToken(result.token);
        }
    }

    function getInviteUrl(token: string) {
        return `${window.location.origin}/invite/${token}`;
    }

    function copyLink(token: string) {
        navigator.clipboard.writeText(getInviteUrl(token));
    }

    return (
        <Box style={{ background: "rgba(255,255,255,0.02)", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
            <Box style={{ padding: "2rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <Stack direction="horizontal" justify="between" align="center">
                    <Box>
                        <Typography style={{ fontSize: "1.25rem", fontWeight: 700 }}>Aktiva Inbjudningar</Typography>
                        <Typography style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>Skapa och hantera åtkomstlänkar</Typography>
                    </Box>
                    <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
                        + skapa inbjudan
                    </button>
                </Stack>
            </Box>

            {newToken && (
                <Box style={{ margin: "2rem", padding: "1.5rem", background: "rgba(0,255,163,0.05)", border: "1px solid rgba(0,255,163,0.1)", borderRadius: "16px" }}>
                    <Stack direction="horizontal" justify="between" align="center">
                        <Stack direction="horizontal" gap={12} align="center">
                            <CheckCircle size={18} style={{ color: "var(--neon-green)" }} />
                            <Typography style={{ color: "var(--neon-green)", fontWeight: 600 }}>Länk skapad: {getInviteUrl(newToken)}</Typography>
                        </Stack>
                        <button className="btn btn-ghost btn-sm" onClick={() => copyLink(newToken)} style={{ color: "var(--neon-green)" }}>
                            <Copy size={14} style={{ marginRight: "6px" }} />
                            kopiera
                        </button>
                    </Stack>
                </Box>
            )}

            {showCreate && (
                <Box style={{ margin: "2rem", padding: "2rem", background: "rgba(255,255,255,0.03)", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <Typography style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.5rem" }}>Ny Inbjudan</Typography>
                    <form action={handleCreate}>
                        <Stack gap={24}>
                            <Stack direction="horizontal" gap={16}>
                                <Box style={{ flex: 1 }}>
                                    <label className="form-label">Antal användningar</label>
                                    <input type="number" name="maxUses" className="input" defaultValue={1} min={1} />
                                </Box>
                                <Box style={{ flex: 1 }}>
                                    <label className="form-label">Giltighetstid (dagar, 0 = aldrig)</label>
                                    <input type="number" name="expiresInDays" className="input" defaultValue={7} min={0} />
                                </Box>
                            </Stack>
                            <Box>
                                <label className="form-label">Mottagarens e-post (valfritt)</label>
                                <input type="email" name="email" className="input" placeholder="användare@exempel.se" />
                            </Box>
                            <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
                                <input type="checkbox" name="singleUse" defaultChecked style={{ width: "18px", height: "18px" }} />
                                <Typography style={{ fontSize: "0.9rem" }}>Begränsa till en användning</Typography>
                            </label>
                            <Stack direction="horizontal" gap={12} justify="end">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>avbryt</button>
                                <button type="submit" className="btn btn-primary" style={{ minWidth: "140px" }} disabled={creating}>
                                    {creating ? "skapar..." : "generera länk"}
                                </button>
                            </Stack>
                        </Stack>
                    </form>
                </Box>
            )}

            <Box style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <th style={{ padding: "1.25rem 1rem", color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700 }}>token</th>
                            <th style={{ padding: "1.25rem 1rem", color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700 }}>skapad av</th>
                            <th style={{ padding: "1.25rem 1rem", color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700 }}>mottagare</th>
                            <th style={{ padding: "1.25rem 1rem", color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700 }}>användningsgrad</th>
                            <th style={{ padding: "1.25rem 1rem", color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700 }}>typ</th>
                            <th style={{ padding: "1.25rem 1rem", color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700 }}>utgår</th>
                            <th style={{ padding: "1.25rem 1rem", color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700 }}>status</th>
                            <th style={{ padding: "1.25rem 1rem", color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700, textAlign: "right" }}>åtgärder</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invites.map((invite) => {
                            const isExpired = invite.expiresAt && new Date(invite.expiresAt) < new Date();
                            const isUsedUp = invite.singleUse
                                ? invite.uses >= 1
                                : invite.maxUses > 0 && invite.uses >= invite.maxUses;

                            return (
                                <tr key={invite.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                                    <td style={{ padding: "1rem" }}>
                                        <code style={{ fontSize: "0.75rem", color: "var(--neon-cyan)", background: "rgba(0,255,255,0.05)", padding: "0.25rem 0.5rem", borderRadius: "4px" }}>
                                            {invite.token.substring(0, 12)}...
                                        </code>
                                    </td>
                                    <td style={{ padding: "1rem" }}>
                                        <Stack direction="horizontal" gap={8} align="center">
                                            <AvatarPreview
                                                avatarId={invite.creatorAvatarId}
                                                name={invite.createdBy}
                                                size="xs"
                                            />
                                            <Typography style={{ fontSize: "0.9rem", color: "white" }}>{invite.createdBy.toLowerCase()}</Typography>
                                        </Stack>
                                    </td>
                                    <td style={{ padding: "1rem" }}>
                                        {invite.email ? (
                                            <Stack gap={2}>
                                                <Typography style={{ fontSize: "0.9rem", color: "white" }}>{invite.email}</Typography>
                                                <Typography style={{ fontSize: "0.7rem", color: invite.isRegistered ? "var(--neon-green)" : "rgba(255,255,255,0.3)" }}>
                                                    {invite.isRegistered ? "registrerad" : "väntar..."}
                                                </Typography>
                                            </Stack>
                                        ) : (
                                            <Stack direction="horizontal" gap={4} align="center" style={{ color: "rgba(255,255,255,0.2)" }}>
                                                <Globe size={12} />
                                                <Typography style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Offentlig</Typography>
                                            </Stack>
                                        )}
                                    </td>
                                    <td style={{ padding: "1rem", color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>{invite.uses} / {invite.maxUses}</td>
                                    <td style={{ padding: "1rem" }}>
                                        <span style={{ padding: "0.2rem 0.6rem", background: "rgba(255,255,255,0.05)", borderRadius: "6px", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                                            {invite.singleUse ? "engångs" : "flergångs"}
                                        </span>
                                    </td>
                                    <td style={{ padding: "1rem", color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
                                        {invite.expiresAt
                                            ? new Date(invite.expiresAt).toLocaleDateString("sv-SE")
                                            : "aldrig"}
                                    </td>
                                    <td style={{ padding: "1rem" }}>
                                        {invite.revoked ? (
                                            <span className="badge badge-red" style={{ fontSize: "0.7rem" }}>återkallad</span>
                                        ) : isExpired ? (
                                            <span className="badge badge-yellow" style={{ fontSize: "0.7rem" }}>utgången</span>
                                        ) : isUsedUp ? (
                                            <span className="badge badge-yellow" style={{ fontSize: "0.7rem" }}>använd</span>
                                        ) : (
                                            <span className="badge badge-green" style={{ fontSize: "0.7rem" }}>aktiv</span>
                                        )}
                                    </td>
                                    <td style={{ padding: "1rem", textAlign: "right" }}>
                                        <Stack direction="horizontal" gap={8} justify="end">
                                            {!invite.revoked && !isExpired && !isUsedUp && (
                                                <>
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={() => copyLink(invite.token)}
                                                        style={{ color: "var(--neon-cyan)" }}
                                                    >
                                                        kopiera
                                                    </button>
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={() => revokeInvite(invite.id)}
                                                        style={{ color: "var(--accent-danger)" }}
                                                    >
                                                        återkalla
                                                    </button>
                                                </>
                                            )}
                                            {(invite.revoked || isExpired) && invite.email && (
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    style={{ color: "var(--neon-green)" }}
                                                    onClick={() => handleReinvite(invite.email!)}
                                                >
                                                    skicka igen
                                                </button>
                                            )}
                                        </Stack>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </Box>
        </Box>
    );
}
