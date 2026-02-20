import { requireSpaceMember } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import ChatView from "./chat-view";

interface Props {
    params: Promise<{ id: string; channelId: string }>;
}

export default async function ChatPage({ params }: Props) {
    const { id, channelId } = await params;
    const user = await requireSpaceMember(id);

    const channel = await prisma.channel.findUnique({
        where: { id: channelId, spaceId: id },
        include: { space: { select: { name: true } } },
    });

    if (!channel) return notFound();

    const messages = await prisma.message.findMany({
        where: { channelId, deletedAt: null },
        orderBy: { createdAt: "asc" },
        take: 100,
        include: { user: { select: { id: true, name: true } } },
    });

    return (
        <ChatView
            channel={{ id: channel.id, name: channel.name, spaceName: channel.space.name }}
            initialMessages={messages.map((m) => ({
                id: m.id,
                content: m.content,
                createdAt: m.createdAt.toISOString(),
                user: { id: m.user.id, name: m.user.name },
            }))}
            currentUser={{ id: user.id, name: user.name }}
            spaceId={id}
        />
    );
}
