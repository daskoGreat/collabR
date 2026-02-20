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
            user1: { select: { id: true, name: true } },
            user2: { select: { id: true, name: true } },
        },
    });

    if (!thread || (thread.user1Id !== userId && thread.user2Id !== userId)) return notFound();

    const otherUser = thread.user1Id === userId ? thread.user2 : thread.user1;
    const currentUser = thread.user1Id === userId ? thread.user1 : thread.user2;

    const messages = await prisma.directMessage.findMany({
        where: { threadId },
        orderBy: { createdAt: "asc" },
        take: 50,
        include: { user: { select: { id: true, name: true } } },
    });

    return (
        <DmView
            threadId={threadId}
            otherUser={otherUser}
            currentUser={{ id: currentUser.id, name: currentUser.name }}
            initialMessages={messages.map((m) => ({
                id: m.id,
                content: m.content,
                createdAt: m.createdAt.toISOString(),
                user: m.user,
            }))}
        />
    );
}
