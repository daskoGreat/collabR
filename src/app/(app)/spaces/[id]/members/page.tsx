import { requireSpaceMember } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import MembersList from "./members-list";
import BackButton from "@/components/back-button";
import Link from "next/link";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function MembersPage({ params }: Props) {
    const { id } = await params;
    const currentUser = await requireSpaceMember(id);

    const space = await prisma.space.findUnique({
        where: { id },
        select: { name: true },
    });

    const memberships = await prisma.spaceMember.findMany({
        where: { spaceId: id },
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { user: { name: "asc" } },
    });

    const members = memberships.map((m: typeof memberships[number]) => ({
        id: m.user.id,
        name: m.user.name,
        role: m.role,
    }));

    return (
        <>
            <div className="topbar">
                <div className="row" style={{ gap: "var(--space-4)" }}>
                    <BackButton />
                    <div className="topbar-title">
                        <Link href="/spaces" className="text-muted hover:text-primary transition-colors">navet</Link>
                        <span className="text-muted mx-2">/</span>
                        <Link href={`/spaces/${id}`} className="text-muted hover:text-primary transition-colors">#{space?.name.toLowerCase()}</Link>
                        <span className="text-muted mx-2">/</span>
                        <span className="topbar-title-highlight">⊡</span> medlemmar
                    </div>
                </div>
            </div>
            <div className="content-area">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">medlemmar</h1>
                        <p className="page-subtitle">{members.length} personer på det här kontoret</p>
                    </div>
                </div>
                <MembersList
                    members={members}
                    currentUserId={currentUser.id}
                    spaceName={space?.name ?? ""}
                />
            </div>
        </>
    );
}
