import { requireSpaceMember } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import FilesView from "./files-view";
import Link from "next/link";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function FilesPage({ params }: Props) {
    const { id } = await params;
    const user = await requireSpaceMember(id);

    const space = await prisma.space.findUnique({
        where: { id },
        select: { name: true },
    });

    const files = await prisma.file.findMany({
        where: { spaceId: id },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
    });

    return (
        <>
            <div className="topbar">
                <div className="topbar-title">
                    <Link href="/spaces" className="text-muted hover:text-primary transition-colors">navet</Link>
                    <span className="text-muted mx-2">/</span>
                    <Link href={`/spaces/${id}`} className="text-muted hover:text-primary transition-colors">#{space?.name.toLowerCase()}</Link>
                    <span className="text-muted mx-2">/</span>
                    <span className="topbar-title-highlight">⊞</span> filer
                </div>
            </div>
            <FilesView
                spaceId={id}
                files={files.map((f: typeof files[number]) => ({
                    id: f.id,
                    name: f.name,
                    size: f.size,
                    mimeType: f.mimeType,
                    url: f.url,
                    uploadedBy: f.user.name,
                    createdAt: f.createdAt.toISOString(),
                }))}
                currentUserId={user.id}
            />
        </>
    );
}
