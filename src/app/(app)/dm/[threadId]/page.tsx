import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import DmView from "./dm-view";

interface Props {
    params: Promise<{ threadId: string }>;
}

export default async function DmPage({ params }: Props) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    const { threadId } = await params;
    const userId = session.user.id;

    const thread = await prisma.directThread.findUnique({
        where: { id: threadId },
        include: {
            members: {
                include: {
                    user: { select: { id: true, name: true, lastSeenAt: true } }
                }
            }
        },
    });

    if (!thread) return notFound();

    const membership = thread.members.find(m => m.userId === userId);
    if (!membership) return notFound();

    const isGroup = thread.isGroup;
    let title = thread.name || "Gruppchatt";
    let otherUser: { id: string; name: string; lastSeenAt: Date | null } | null = null;

    if (!isGroup) {
        const otherMember = thread.members.find(m => m.userId !== userId);
        otherUser = otherMember?.user || { id: "unknown", name: "Borttagen användare", lastSeenAt: null };
        title = otherUser.name;
    }

    const currentUser = membership.user;

    const messages = await prisma.directMessage.findMany({
        where: { threadId },
        orderBy: { createdAt: "asc" },
        take: 50,
        include: {
            user: { select: { id: true, name: true } },
            attachments: true
        },
    });

    return (
        <DmView
            threadId={threadId}
            title={title}
            isGroup={isGroup}
            otherUser={otherUser}
            currentUser={{ id: currentUser.id, name: currentUser.name }}
            initialMessages={messages.map((m: any) => ({
                id: m.id,
                content: m.content,
                createdAt: m.createdAt.toISOString(),
                user: m.user,
                attachments: m.attachments,
            }))}
        />
    );
}
