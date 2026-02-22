"use client";

import { useState } from "react";
import { banUser, unbanUser, changeUserRole, inviteNewUser, regenerateUserInvite } from "@/lib/actions/admin";

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

    async function handleRegenerate(userId: string) {
        const result = await regenerateUserInvite(userId);
        if (result?.token) {
            setNewToken(result.token);
        }
    }

    const copyToClipboard = (token: string) => {
        const url = `${window.location.origin}/invite/${token}`;
        navigator.clipboard.writeText(url);
    };

    function getUserStatus(user: User) {
        if (user.banned) return { label: "banned", class: "badge-red" };
        if (user.passwordHash) return { label: "active", class: "badge-green" };

        const latestInvite = user.invites[0];
        if (!latestInvite) return { label: "no invite", class: "badge-muted" };

        const isExpired = latestInvite.expiresAt && new Date(latestInvite.expiresAt) < new Date();
        const isRevoked = latestInvite.revoked;

        if (isRevoked || isExpired) return { label: "invite expired", class: "badge-yellow" };
        return { label: "invite pending", class: "badge-cyan" };
    }

    return (
        <div className="content-area">
            <div className="page-header">
                <div>
                    <h1 className="page-title">users</h1>
                    <p className="page-subtitle">{users.length} registered members</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowInviteModal(true)}>
                    + invite user
                </button>
            </div>

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>name</th>
                            <th>email</th>
                            <th>role</th>
                            <th>spaces</th>
                            <th>status</th>
                            <th>joined</th>
                            <th style={{ textAlign: "right" }}>actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => {
                            const status = getUserStatus(user);
                            const latestToken = user.invites[0]?.token;

                            return (
                                <tr key={user.id}>
                                    <td className="font-semibold">{user.name}</td>
                                    <td className="text-muted">{user.email}</td>
                                    <td>
                                        {user.id === currentUserId ? (
                                            <span className="badge badge-green">{user.role.toLowerCase()}</span>
                                        ) : (
                                            <select
                                                className="select"
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            >
                                                <option value="MEMBER">member</option>
                                                <option value="MODERATOR">moderator</option>
                                                <option value="ADMIN">admin</option>
                                            </select>
                                        )}
                                    </td>
                                    <td>{user.spaceCount}</td>
                                    <td>
                                        <span className={`badge ${status.class}`}>{status.label}</span>
                                    </td>
                                    <td className="text-muted">
                                        {new Date(user.createdAt).toLocaleDateString("sv-SE")}
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        <div style={{ position: "relative", display: "inline-block" }}>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => setMenuOpen(menuOpen === user.id ? null : user.id)}
                                                style={{ fontSize: "1.2rem", lineHeight: 1 }}
                                            >
                                                ⋮
                                            </button>

                                            {menuOpen === user.id && (
                                                <div className="dropdown-menu shadow-lg" style={{ right: 0, top: "100%", zIndex: 100 }}>
                                                    {status.label.includes("invite") && latestToken && (
                                                        <button
                                                            className="dropdown-item"
                                                            onClick={() => { copyToClipboard(latestToken); setMenuOpen(null); }}
                                                        >
                                                            <span style={{ marginRight: "0.5rem" }}>❐</span>
                                                            copy link
                                                        </button>
                                                    )}

                                                    {!user.passwordHash && (
                                                        <button
                                                            className="dropdown-item"
                                                            onClick={() => { handleRegenerate(user.id); setMenuOpen(null); }}
                                                        >
                                                            <span style={{ marginRight: "0.5rem" }}>↻</span>
                                                            regenerate
                                                        </button>
                                                    )}

                                                    {user.id !== currentUserId && (
                                                        <>
                                                            {user.banned ? (
                                                                <button
                                                                    className="dropdown-item text-success"
                                                                    onClick={() => { handleUnban(user.id); setMenuOpen(null); }}
                                                                >
                                                                    unban user
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    className="dropdown-item text-danger"
                                                                    onClick={() => { setBanModal(user.id); setMenuOpen(null); }}
                                                                >
                                                                    ban user
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="modal-overlay" onClick={() => { setShowInviteModal(false); setNewToken(null); }}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-title">invite new user</div>

                        {newToken ? (
                            <div style={{ textAlign: "center" }}>
                                <div className="success-text mb-4">
                                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✓</div>
                                    user invited successfully
                                </div>
                                <div className="helper-banner mb-4">
                                    <div className="text-xs text-muted mb-1">// activation link</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                                        <code className="bg-black/50 p-2 rounded block w-full text-left truncate">
                                            {window.location.origin}/invite/{newToken}
                                        </code>
                                        <button className="btn btn-primary btn-sm" onClick={() => copyToClipboard(newToken)}>
                                            copy
                                        </button>
                                    </div>
                                </div>
                                <button className="btn btn-primary w-full" onClick={() => { setShowInviteModal(false); setNewToken(null); }}>
                                    done
                                </button>
                            </div>
                        ) : (
                            <form action={handleInvite}>
                                <div className="form-group mb-4">
                                    <label className="form-label">full name</label>
                                    <input name="name" className="input" placeholder="jane doe" required />
                                </div>
                                <div className="form-group mb-4">
                                    <label className="form-label">email address</label>
                                    <input type="email" name="email" className="input" placeholder="jane@example.com" required />
                                </div>
                                <div className="form-group mb-4">
                                    <label className="form-label">role</label>
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
                                        {loading ? "generating..." : "generate invite"}
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
                        <div className="modal-title">ban user</div>
                        <form action={handleBan}>
                            <input type="hidden" name="userId" value={banModal} />
                            <div className="form-group mb-4">
                                <label className="form-label">reason</label>
                                <textarea
                                    name="reason"
                                    className="input"
                                    placeholder="why are you banning this user?"
                                    required
                                />
                            </div>
                            <div className="form-group mb-4">
                                <label className="form-label">ban type</label>
                                <select name="type" className="select w-full">
                                    <option value="SOFT">soft ban (can be unbanned)</option>
                                    <option value="HARD">hard ban (permanent, blocks email)</option>
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
                                    {banning ? "banning..." : "confirm ban"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
