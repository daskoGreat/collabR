"use client";

import { useState } from "react";
import { createInvite, revokeInvite, reinviteUser } from "@/lib/actions/admin";

interface Invite {
    id: string;
    token: string;
    email: string | null;
    createdBy: string;
    maxUses: number;
    uses: number;
    singleUse: boolean;
    expiresAt: string | null;
    revoked: boolean;
    createdAt: string;
    isRegistered: boolean;
}

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
        <div className="content-area">
            <div className="page-header">
                <div>
                    <h1 className="page-title">invites</h1>
                    <p className="page-subtitle">create and manage invite tokens</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
                    + create invite
                </button>
            </div>

            {newToken && (
                <div className="success-text mb-[var(--space-4)] row-between">
                    <span>invite created! link: {getInviteUrl(newToken)}</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => copyLink(newToken)}>
                        copy
                    </button>
                </div>
            )}

            {showCreate && (
                <div className="card mb-[var(--space-6)]">
                    <div className="modal-title">create invite</div>
                    <form className="auth-form" action={handleCreate}>
                        <div className="row" style={{ gap: "var(--space-4)" }}>
                            <div className="form-group flex-1">
                                <label className="form-label">max uses</label>
                                <input type="number" name="maxUses" className="input" defaultValue={1} min={1} />
                            </div>
                            <div className="form-group flex-1">
                                <label className="form-label">expires in (days, 0 = never)</label>
                                <input type="number" name="expiresInDays" className="input" defaultValue={7} min={0} />
                            </div>
                        </div>
                        <div className="form-group mb-[var(--space-4)]">
                            <label className="form-label">recipient email (optional)</label>
                            <input type="email" name="email" className="input" placeholder="user@example.com" />
                        </div>
                        <div className="form-group">
                            <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer" }}>
                                <input type="checkbox" name="singleUse" defaultChecked />
                                <span className="text-sm">single use</span>
                            </label>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={creating}>
                                {creating ? "creating..." : "generate invite"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>token</th>
                            <th>created by</th>
                            <th>recipient</th>
                            <th>uses</th>
                            <th>type</th>
                            <th>expires</th>
                            <th>status</th>
                            <th>actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invites.map((invite) => {
                            const isExpired = invite.expiresAt && new Date(invite.expiresAt) < new Date();
                            const isUsedUp = invite.singleUse
                                ? invite.uses >= 1
                                : invite.maxUses > 0 && invite.uses >= invite.maxUses;

                            return (
                                <tr key={invite.id}>
                                    <td>
                                        <code className="text-xs" style={{ color: "var(--neon-cyan)" }}>
                                            {invite.token.substring(0, 12)}...
                                        </code>
                                    </td>
                                    <td>{invite.createdBy}</td>
                                    <td>
                                        {invite.email ? (
                                            <div style={{ display: "flex", flexDirection: "column" }}>
                                                <span className="text-sm">{invite.email}</span>
                                                {invite.isRegistered ? (
                                                    <span className="text-xs text-success">registered</span>
                                                ) : (
                                                    <span className="text-xs text-muted">pending registration</span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted text-xs">public link</span>
                                        )}
                                    </td>
                                    <td>{invite.uses}/{invite.maxUses}</td>
                                    <td>
                                        <span className="badge badge-muted">
                                            {invite.singleUse ? "single" : "multi"}
                                        </span>
                                    </td>
                                    <td className="text-muted">
                                        {invite.expiresAt
                                            ? new Date(invite.expiresAt).toLocaleDateString("sv-SE")
                                            : "never"}
                                    </td>
                                    <td>
                                        {invite.revoked ? (
                                            <span className="badge badge-red">revoked</span>
                                        ) : isExpired ? (
                                            <span className="badge badge-yellow">expired</span>
                                        ) : isUsedUp ? (
                                            <span className="badge badge-yellow">used</span>
                                        ) : (
                                            <span className="badge badge-green">active</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="row">
                                            {!invite.revoked && !isExpired && !isUsedUp && (
                                                <>
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={() => copyLink(invite.token)}
                                                    >
                                                        copy
                                                    </button>
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => revokeInvite(invite.id)}
                                                    >
                                                        revoke
                                                    </button>
                                                </>
                                            )}
                                            {(invite.revoked || isExpired) && invite.email && (
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    style={{ color: "var(--neon-green)" }}
                                                    onClick={() => handleReinvite(invite.email!)}
                                                >
                                                    re-invite
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
