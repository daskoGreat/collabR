"use client";

import { useRouter } from "next/navigation";

interface Props {
    className?: string;
    label?: string;
}

export default function BackButton({ className = "btn btn-ghost btn-sm", label = "Tillbaka" }: Props) {
    const router = useRouter();

    return (
        <button
            onClick={() => router.back()}
            className={className}
            aria-label="Gå tillbaka"
        >
            <span style={{ marginRight: "4px" }}>←</span>
            {label}
        </button>
    );
}
