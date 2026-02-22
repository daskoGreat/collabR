"use client";

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
                className="card"
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
                <h3 className="page-title mb-4" style={{ fontSize: "var(--font-size-md)" }}>
                    Logga ut?
                </h3>
                <p className="text-secondary mb-6" style={{ fontSize: "var(--font-size-sm)" }}>
                    Är du säker på att du vill logga ut från collab?
                </p>
                <div className="row" style={{ justifyContent: "flex-end", gap: "var(--space-3)" }}>
                    <button className="btn btn-ghost" onClick={onClose}>
                        Avbryt
                    </button>
                    <button className="btn btn-danger" onClick={onConfirm}>
                        Logga ut
                    </button>
                </div>
            </div>
        </div>
    );
}
