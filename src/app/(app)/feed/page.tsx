import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import FeedView from "@/components/feed-view";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { Typography } from "@/components/ui/typography";
import { Box } from "@/components/layout/Box";

export default async function FeedPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true }
    });

    if (!user) redirect("/login");

    const posts = await prisma.feedPost.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    avatarConfig: {
                        select: { avatarId: true }
                    }
                }
            },
            attachments: true,
            reactions: { select: { type: true, userId: true } },
            _count: { select: { comments: true } }
        },
        orderBy: { createdAt: "desc" }
    });

    // Serialize dates
    const serializedPosts = posts.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        attachments: p.attachments.map(a => ({
            ...a,
            createdAt: a.createdAt.toISOString(),
        })),
    }));

    return (
        <Container style={{ paddingBottom: '4rem', paddingTop: '2rem' }}>
            <Stack gap={48}>
                <Box>
                    <Typography style={{ fontSize: "2.5rem", fontWeight: 700, fontFamily: "var(--font-outfit)" }}>
                        Insikter
                    </Typography>
                    <Typography style={{ color: "rgba(255,255,255,0.4)", fontSize: "1.1rem", maxWidth: "600px" }}>
                        Dela tankar, länkar och erfarenheter med dina kollegor i ett samarbetsfokuserat flöde.
                    </Typography>
                </Box>
                <FeedView
                    initialPosts={serializedPosts as any}
                    currentUser={user as any}
                />
            </Stack>
        </Container>
    );
}
