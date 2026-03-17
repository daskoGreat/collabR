import { requireSpaceMember } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { Typography } from "@/components/ui/typography";
import { Box } from "@/components/layout/Box";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function SpaceDetailPage({ params }: Props) {
    const { id } = await params;
    const currentUser = await requireSpaceMember(id);

    const space = await prisma.space.findUnique({
        where: { id },
        include: {
            _count: { select: { members: true, posts: true } },
        },
    });

    if (!space) return notFound();

    const recentPosts = await prisma.post.findMany({
        where: { spaceId: id },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { name: true } }, _count: { select: { answers: true } } },
    });

    return (
        <Box style={{ minHeight: '100vh', background: '#000000', color: '#ffffff', padding: '6rem 2rem' }}>
            <Container style={{ maxWidth: '800px' }}>
                <Stack direction="vertical" gap="xl">

                    {/* Category Title */}
                    <Typography variant="h1" style={{ fontSize: '3.5rem', fontWeight: 800 }}>
                        {space.name}
                    </Typography>

                    {/* Start a conversation */}
                    <Stack direction="vertical" gap="lg" style={{ marginTop: '2rem' }}>
                        <Typography style={{ fontSize: '2rem', fontWeight: 700 }}>
                            start a conversation
                        </Typography>
                        <Box style={{
                            background: '#1a1a1a',
                            padding: '2.5rem',
                            borderRadius: '32px',
                            border: '2px solid rgba(255,255,255,0.05)'
                        }}>
                            <Box style={{ position: 'relative' }}>
                                <textarea
                                    placeholder="what is on your mind?"
                                    style={{
                                        width: '100%',
                                        minHeight: '120px',
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#ffffff',
                                        fontSize: '1.25rem',
                                        outline: 'none',
                                        resize: 'none',
                                        lineHeight: 1.6
                                    }}
                                />
                                <Box style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    marginTop: '1.5rem'
                                }}>
                                    <Box style={{
                                        background: '#ffffff',
                                        color: '#000000',
                                        padding: '1rem 2.5rem',
                                        borderRadius: '9999px',
                                        fontWeight: 800,
                                        fontSize: '1.1rem',
                                        cursor: 'pointer'
                                    }}>
                                        post message ❤️
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Stack>

                    {/* Recent discussions */}
                    <Stack direction="vertical" gap="lg" style={{ marginTop: '4rem' }}>
                        <Typography style={{ fontSize: '2rem', fontWeight: 700 }}>
                            recent discussions
                        </Typography>

                        <Stack direction="vertical" gap="md">
                            {recentPosts.length === 0 ? (
                                <Typography style={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', fontSize: '1.1rem' }}>
                                    No conversations yet. be the first to start one.
                                </Typography>
                            ) : (
                                recentPosts.map((post) => (
                                    <Link key={post.id} href={`/spaces/${id}/help/${post.id}`} style={{ textDecoration: 'none' }}>
                                        <Box style={{
                                            padding: '1rem 0',
                                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                                            transition: 'transform 0.2s',
                                            cursor: 'pointer'
                                        }} className="hover:translate-x-2">
                                            <Stack direction="horizontal" gap="md" align="center">
                                                <Typography style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff' }}>
                                                    • {post.title}
                                                </Typography>
                                                <Typography style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }}>
                                                    {formatDistanceToNow(new Date(post.createdAt), { locale: sv })} ago
                                                </Typography>
                                            </Stack>
                                        </Box>
                                    </Link>
                                ))
                            )}
                        </Stack>
                    </Stack>

                </Stack>
            </Container>
        </Box>
    );
}
