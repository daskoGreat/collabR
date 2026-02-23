"use client";

import { useEffect, useState } from "react";

interface User {
    id: string;
    name: string;
}

interface MentionListProps {
    users: User[];
    selectedIndex: number;
    onSelect: (user: User) => void;
    loading?: boolean;
}

import { LoadingSpinner } from "./ui/loading-spinner";

export default function MentionList({ users, selectedIndex, onSelect, loading }: MentionListProps) {
    if (loading) {
        return (
            <div className="mention-list-container">
                <div className="mention-list p-4 flex justify-center">
                    <LoadingSpinner size="sm" />
                </div>
            </div>
        );
    }

    if (users.length === 0) return null;

    return (
        <div className="mention-list-container">
            <div className="mention-list">
                {users.map((user, index) => (
                    <div
                        key={user.id}
                        className={`mention-item ${index === selectedIndex ? "active" : ""}`}
                        onMouseDown={(e) => {
                            e.preventDefault(); // Prevent input blur
                            onSelect(user);
                        }}
                    >
                        <span className="mention-item-avatar">
                            {user.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="mention-item-name">{user.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
