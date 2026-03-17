import { requireSpaceMember } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import MembersList from "./members-list";
import BackButton from "@/components/back-button";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { Typography } from "@/components/ui/typography";
import { Box } from "@/components/layout/Box";

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
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    role: true,
                    avatarConfig: { select: { avatarId: true } }
                }
            }
        },
        orderBy: { user: { name: "asc" } },
    });

    const members = memberships.map((m: any) => ({
        id: m.user.id,
        name: m.user.name,
        role: m.role,
        avatarId: m.user.avatarConfig?.avatarId
    }));

    return (
        <Container style={{ paddingBottom: '4rem', paddingTop: '2rem' }}>
            <Stack gap={48}>
                <Box>
                    <Stack direction="horizontal" gap={16} align="center" style={{ marginBottom: "1.5rem" }}>
                        <BackButton />
                        <Stack direction="horizontal" gap={8} align="center">
                            <Link href="/spaces" style={{ textDecoration: "none" }}>
                                <Typography style={{ color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>navet</Typography>
                            </Link>
                            <Typography style={{ color: "rgba(255,255,255,0.2)" }}>/</Typography>
                            <Link href={`/spaces/${id}`} style={{ textDecoration: "none" }}>
                                <Typography style={{ color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>#{space?.name.toLowerCase()}</Typography>
                            </Link>
                            <Typography style={{ color: "rgba(255,255,255,0.2)" }}>/</Typography>
                            <Typography style={{ color: "white", fontWeight: 700 }}>medlemmar</Typography>
                        </Stack>
                    </Stack>

                    <Stack gap={4}>
                        <Typography style={{ fontSize: "2.5rem", fontWeight: 700, fontFamily: "var(--font-outfit)" }}>
                            Medlemmar
                        </Typography>
                        <Typography style={{ color: "rgba(255,255,255,0.4)", fontSize: "1.1rem" }}>
                            {members.length} personer på det här kontoret
                        </Typography>
                    </Stack>
                </Box>

                <MembersList
                    members={members}
                    currentUserId={currentUser.id}
                    spaceName={space?.name ?? ""}
                />
            </Stack>
        </Container>
    );
}
