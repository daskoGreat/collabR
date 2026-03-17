"use client";

import { Stack } from "@/components/layout/Stack";
import { Typography } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function LogoutConfirmation({ isOpen, onClose, onConfirm }: Props) {
    if (!isOpen) return null;

    return (
        <div className="sidebar-overlay visible" style={{ zIndex: 1000 }} onClick={onClose}>
            <div
                style={{
                    position: "fixed",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "90%",
                    maxWidth: "400px",
                    zIndex: 1001
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <Card>
                    <Stack direction="vertical" gap="lg">
                        <Stack direction="vertical" gap="sm">
                            <Typography variant="h3">Sign Out?</Typography>
                            <Typography variant="body" className="text-secondary">
                                Are you sure you want to sign out from The Support Network?
                            </Typography>
                        </Stack>

                        <Stack direction="horizontal" justify="end" gap="md">
                            <button className="btn btn-ghost" onClick={onClose}>
                                Cancel
                            </button>
                            <button className="btn btn-danger" onClick={onConfirm}>
                                Sign Out
                            </button>
                        </Stack>
                    </Stack>
                </Card>
            </div>
        </div>
    );
}
