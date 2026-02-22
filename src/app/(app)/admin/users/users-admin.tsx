"use client";

import { useState } from "react";
import { banUser, unbanUser, changeUserRole, inviteNewUser, regenerateUserInvite, deleteUser } from "@/lib/actions/admin";

interface User {
    id: string;
    name: string;
    email: string;
    passwordHash: string | null;
    role: string;
    banned: boolean;
    bannedReason: string | null;
    spaceCount: number;
    createdAt: string;
    invites: {
        token: string;
        expiresAt: string | null;
        revoked: boolean;
        uses: number;
    }[];
}

interface Props {
    users: User[];
    currentUserId: string;
}

export default function UsersAdmin({ users, currentUserId }: Props) {
    // Modal & Action states
    const [banModal, setBanModal] = useState<string | null>(null);
    const [banning, setBanning] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [newToken, setNewToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [menuOpen, setMenuOpen] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Actions
    async function handleBan(formData: FormData) {
        setBanning(true);
        await banUser(formData);
        setBanning(false);
        setBanModal(null);
    }

    async function handleUnban(userId: string) {
        await unbanUser(userId);
    }

    async function handleRoleChange(userId: string, role: string) {
        await changeUserRole(userId, role as "ADMIN" | "MODERATOR" | "MEMBER");
    }

    async function handleInvite(formData: FormData) {
        setLoading(true);
        const result = await inviteNewUser(formData);
        if (result?.token) {
            setNewToken(result.token);
        }
        setLoading(false);
    }

    async function handleReinvite(userId: string) {
        const result = await regenerateUserInvite(userId);
        if (result?.token) {
            setNewToken(result.token);
            setShowInviteModal(true); // Open modal to show the link
        }
    }

    const copyToClipboard = (token: string) => {
        const url = `${window.location.origin}/invite/${token}`;
        navigator.clipboard.writeText(url);
    };

    async function handleDelete(userId: string) {
        setDeleting(true);
        const result = await deleteUser(userId);
        if (result?.error) {
            alert(result.error);
        }
        setDeleting(false);
        setDeleteModal(null);
    }

    function getUserStatus(user: User) {
        if (user.banned) return { label: "disabled", class: "badge-red" };
        if (user.passwordHash) return { label: "active", class: "badge-green" };

        const latestInvite = user.invites[0];
        if (!latestInvite) return { label: "not invited", class: "badge-muted" };

        const isExpired = latestInvite.expiresAt && new Date(latestInvite.expiresAt) < new Date();
        const isRevoked = latestInvite.revoked;

        if (isRevoked || isExpired) return { label: "invite expired", class: "badge-yellow" };
        return { label: "pending", class: "badge-cyan" };
    }

    return (
        <div className="content-area">
            <div className="page-header">
                <div>
                    <h1 className="page-title">user management</h1>
                    <p className="page-subtitle">{users.length} members tracked in system</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowInviteModal(true)}>
                    + invite member
                </button>
            </div>

            <div className="table-wrapper">
                <table className="w-full">
                    <thead>
                        <tr>
                            <th>member</th>
                            <th>role</th>
                            <th>spaces</th>
                            <th>status</th>
                            <th>joined</th>
                            <th style={{ textAlign: "right" }}>management</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => {
                            const status = getUserStatus(user);
                            const latestToken = user.invites[0]?.token;
                            const isPending = !user.passwordHash;

                            return (
                                <tr key={user.id}>
                                    <td>
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            <span className="font-semibold" style={{ color: "var(--text-bright)" }}>{user.name}</span>
                                            <span className="text-xs text-muted" style={{ fontStyle: "italic" }}>{user.email}</span>
                                        </div>
                                    </td>
                                    <td>
                                        {user.id === currentUserId ? (
                                            <span className="badge badge-green">{user.role.toLowerCase()}</span>
                                        ) : (
                                            <select
                                                className="select"
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                style={{ padding: "1px 8px" }}
                                            >
                                                <option value="MEMBER">member</option>
                                                <option value="MODERATOR">moderator</option>
                                                <option value="ADMIN">admin</option>
                                            </select>
                                        )}
                                    </td>
                                    <td>
                                        <span className="text-secondary">{user.spaceCount}</span>
                                    </td>
                                    <td>
                                        <span className={`badge ${status.class}`}>{status.label}</span>
                                    </td>
                                    <td className="text-muted text-xs">
                                        {new Date(user.createdAt).toLocaleDateString("sv-SE")}
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        <div className="action-row" style={{ justifyContent: "flex-end" }}>
                                            {isPending && latestToken && (
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => copyToClipboard(latestToken)}
                                                    title="copy invite link"
                                                    style={{ color: "var(--neon-cyan)" }}
                                                >
                                                    ❐ copy link
                                                </button>
                                            )}

                                            <div style={{ position: "relative" }}>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => setMenuOpen(menuOpen === user.id ? null : user.id)}
                                                    style={{ fontSize: "1.2rem", padding: "0 8px" }}
                                                >
                                                    ⋮
                                                </button>

                                                {menuOpen === user.id && (
                                                    <div className="dropdown-menu shadow-lg">
                                                        {isPending && (
                                                            <button
                                                                className="dropdown-item"
                                                                onClick={() => { handleReinvite(user.id); setMenuOpen(null); }}
                                                            >
                                                                <span style={{ color: "var(--neon-green)" }}>↻</span>
                                                                re-invite user
                                                            </button>
                                                        )}

                                                        {user.id !== currentUserId && (
                                                            <>
                                                                {user.banned ? (
                                                                    <button
                                                                        className="dropdown-item text-success"
                                                                        onClick={() => { handleUnban(user.id); setMenuOpen(null); }}
                                                                    >
                                                                        enable user
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        className="dropdown-item text-danger"
                                                                        onClick={() => { setBanModal(user.id); setMenuOpen(null); }}
                                                                    >
                                                                        disable user
                                                                    </button>
                                                                )}
                                                                <button
                                                                    className="dropdown-item text-danger"
                                                                    onClick={() => { setDeleteModal(user.id); setMenuOpen(null); }}
                                                                >
                                                                    <span style={{ color: "var(--accent-danger)" }}>✖</span>
                                                                    remove user
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Invite / Re-invite Modal */}
            {showInviteModal && (
                <div className="modal-overlay" onClick={() => { setShowInviteModal(false); setNewToken(null); }}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-title">
                            {newToken ? "activation link ready" : "invite new member"}
                        </div>

                        {newToken ? (
                            <div style={{ textAlign: "center" }}>
                                <div className="success-text mb-6">
                                    <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>✓</div>
                                    the secure link has been generated
                                </div>
                                <div className="helper-banner mb-6 text-left">
                                    <div className="text-xs text-muted mb-2">// deploy link to user</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                                        <code className="bg-black/50 p-3 rounded block w-full text-left truncate text-neon border border-white/5">
                                            {window.location.origin}/invite/{newToken}
                                        </code>
                                        <button className="btn btn-primary" onClick={() => copyToClipboard(newToken)}>
                                            copy
                                        </button>
                                    </div>
                                </div>
                                <button className="btn btn-secondary w-full" onClick={() => { setShowInviteModal(false); setNewToken(null); }}>
                                    close
                                </button>
                            </div>
                        ) : (
                            <form action={handleInvite}>
                                <div className="form-group mb-5">
                                    <label className="form-label">full name</label>
                                    <input name="name" className="input" placeholder="full name" required />
                                </div>
                                <div className="form-group mb-5">
                                    <label className="form-label">email address</label>
                                    <input type="email" name="email" className="input" placeholder="user@example.com" required />
                                </div>
                                <div className="form-group mb-6">
                                    <label className="form-label">global role</label>
                                    <select name="role" className="select w-full">
                                        <option value="MEMBER">member</option>
                                        <option value="MODERATOR">moderator</option>
                                        <option value="ADMIN">admin</option>
                                    </select>
                                </div>
                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowInviteModal(false)}
                                    >
                                        cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? "generating..." : "generate protocol"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Ban Modal */}
            {banModal && (
                <div className="modal-overlay" onClick={() => setBanModal(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-title">disable member access</div>
                        <form action={handleBan}>
                            <input type="hidden" name="userId" value={banModal} />
                            <div className="form-group mb-5">
                                <label className="form-label">reason for deactivation</label>
                                <textarea
                                    name="reason"
                                    className="input"
                                    placeholder="provide incident report or justification..."
                                    required
                                />
                            </div>
                            <div className="form-group mb-6">
                                <label className="form-label">restriction tier</label>
                                <select name="type" className="select w-full">
                                    <option value="SOFT">soft restriction (reversible)</option>
                                    <option value="HARD">hard ban (permanent, email blocked)</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setBanModal(null)}
                                >
                                    cancel
                                </button>
                                <button type="submit" className="btn btn-danger" disabled={banning}>
                                    {banning ? "processing..." : "confirm deactivation"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal && (
                <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ borderColor: "var(--accent-danger)" }}>
                        <div className="modal-title" style={{ color: "var(--accent-danger)" }}>terminal closure: remove member</div>
                        <div className="helper-banner mb-6" style={{ background: "var(--accent-danger-bg)", borderColor: "var(--accent-danger)" }}>
                            <strong style={{ color: "var(--accent-danger)" }}>WARNING:</strong> This action is permanent. Deleting this user will immediately revoke all access and remove their profile from the system.
                        </div>
                        <p className="text-sm text-secondary mb-6">
                            Are you absolutely sure you want to remove <span className="font-bold text-bright">{users.find(u => u.id === deleteModal)?.name}</span>?
                        </p>
                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setDeleteModal(null)}
                            >
                                cancel
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={() => handleDelete(deleteModal)}
                                disabled={deleting}
                            >
                                {deleting ? "executing..." : "confirm removal"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
