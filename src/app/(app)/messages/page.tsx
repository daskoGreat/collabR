import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { Typography } from "@/components/ui/typography";
import { Box } from "@/components/layout/Box";
import { AvatarPreview } from "@/components/avatar-builder/AvatarPreview";
import { MessageSquare, Users } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Meddelanden - The Support Network",
};

export default async function MessagesPage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    const userId = (session.user as any).id;

    // Fetch the user's direct message threads
    const threadMemberships = await prisma.threadMember.findMany({
        where: { userId },
        include: {
            thread: {
                include: {
                    members: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    avatarConfig: { select: { avatarId: true } }
                                }
                            }
                        }
                    },
                    messages: {
                        orderBy: { createdAt: "desc" },
                        take: 1
                    }
                }
            }
        },
        orderBy: { thread: { createdAt: "desc" } },
    });

    return (
        <Container style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-12)' }}>
            <Stack gap={32}>
                <Box style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <MessageSquare size={28} className="text-neon-green" />
                    <Typography style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-outfit)' }}>
                        Mina Meddelanden
                    </Typography>
                </Box>

                {threadMemberships.length === 0 ? (
                    <Box style={{
                        padding: 'var(--space-12)',
                        textAlign: 'center',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <MessageSquare size={48} style={{ opacity: 0.2, margin: '0 auto 1.5rem auto' }} />
                        <Typography style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            Inga meddelanden än
                        </Typography>
                        <Typography className="text-secondary">
                            Du har inte startat några privata konversationer ännu. Utforska nätverket för att hitta andra att prata med.
                        </Typography>
                        <Link href="/network" style={{ marginTop: '2rem', display: 'inline-block' }}>
                            <Box style={{
                                padding: '12px 24px',
                                background: 'white',
                                color: 'black',
                                borderRadius: '12px',
                                fontWeight: 600,
                            }}>
                                Utforska nätverket
                            </Box>
                        </Link>
                    </Box>
                ) : (
                    <Box style={{ display: 'grid', gap: '16px' }}>
                        {threadMemberships.map((membership) => {
                            const t = membership.thread;
                            const isGroup = t.isGroup;
                            const otherMember = t.members.find(m => m.userId !== userId);
                            const otherUserRaw = otherMember?.user || { id: "unknown", name: "Borttagen användare", avatarConfig: null } as any;
                            const lastMessage = t.messages[0];

                            const avatarId = isGroup ? "community" : otherUserRaw.avatarConfig?.avatarId;
                            const displayName = isGroup ? (t.name || "Namnlös grupp") : otherUserRaw.name;
                            const iconElement = isGroup ? <Users size={18} /> : null;

                            return (
                                <Link key={t.id} href={`/messages/${t.id}`} style={{ textDecoration: 'none' }}>
                                    <Box style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '20px',
                                        padding: '1.5rem',
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        transition: 'all 0.2s',
                                    }} className="hover:bg-white/[0.05] hover:border-white/10">

                                        <Box style={{ position: 'relative' }}>
                                            <AvatarPreview
                                                avatarId={avatarId}
                                                name={displayName}
                                                size={56}
                                                accentColor={isGroup ? "#00e676" : "#ffffff"}
                                            />
                                            {isGroup && (
                                                <Box style={{
                                                    position: 'absolute',
                                                    bottom: -4,
                                                    right: -4,
                                                    background: '#1a1a1a',
                                                    padding: '2px',
                                                    borderRadius: '50%',
                                                    display: 'flex'
                                                }}>
                                                    {iconElement}
                                                </Box>
                                            )}
                                        </Box>

                                        <Box style={{ flex: 1, minWidth: 0 }}>
                                            <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                                                <Typography style={{ fontWeight: 600, fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {displayName}
                                                </Typography>
                                                {lastMessage && (
                                                    <Typography style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
                                                        {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true, locale: sv })}
                                                    </Typography>
                                                )}
                                            </Box>

                                            <Typography style={{
                                                fontSize: '0.9rem',
                                                color: 'rgba(255,255,255,0.6)',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {lastMessage ? (
                                                    lastMessage.userId === userId ? `Du: ${lastMessage.content}` : `${lastMessage.content}`
                                                ) : (
                                                    "Inget meddelande ännu"
                                                )}
                                            </Typography>
                                        </Box>

                                    </Box>
                                </Link>
                            );
                        })}
                    </Box>
                )}
            </Stack>
        </Container>
    );
}
