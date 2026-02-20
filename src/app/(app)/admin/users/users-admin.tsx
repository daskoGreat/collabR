"use client";

import { useState } from "react";
import { banUser, unbanUser, changeUserRole } from "@/lib/actions/admin";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    banned: boolean;
    bannedReason: string | null;
    spaceCount: number;
    createdAt: string;
}

interface Props {
    users: User[];
    currentUserId: string;
}

export default function UsersAdmin({ users, currentUserId }: Props) {
    const [banModal, setBanModal] = useState<string | null>(null);
    const [banning, setBanning] = useState(false);

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

    return (
        <div className="content-area">
            <div className="page-header">
                <div>
                    <h1 className="page-title">users</h1>
                    <p className="page-subtitle">{users.length} registered members</p>
                </div>
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
                            <th>actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
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
                                    {user.banned ? (
                                        <span className="badge badge-red" title={user.bannedReason || ""}>
                                            banned
                                        </span>
                                    ) : (
                                        <span className="badge badge-green">active</span>
                                    )}
                                </td>
                                <td className="text-muted">
                                    {new Date(user.createdAt).toLocaleDateString("sv-SE")}
                                </td>
                                <td>
                                    {user.id !== currentUserId && (
                                        <>
                                            {user.banned ? (
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => handleUnban(user.id)}
                                                >
                                                    unban
                                                </button>
                                            ) : (
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => setBanModal(user.id)}
                                                >
                                                    ban
                                                </button>
                                            )}
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

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
