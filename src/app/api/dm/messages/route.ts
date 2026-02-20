import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get("threadId");
    const after = searchParams.get("after");

    if (!threadId) return NextResponse.json({ error: "threadId required" }, { status: 400 });

    const userId = session.user.id;
    const thread = await prisma.directThread.findUnique({ where: { id: threadId } });
    if (!thread || (thread.user1Id !== userId && thread.user2Id !== userId)) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    let afterDate: Date | undefined;
    if (after) {
        const ref = await prisma.directMessage.findUnique({ where: { id: after }, select: { createdAt: true } });
        if (ref) afterDate = ref.createdAt;
    }

    const messages = await prisma.directMessage.findMany({
        where: {
            threadId,
            ...(afterDate ? { createdAt: { gt: afterDate } } : {}),
        },
        orderBy: { createdAt: "asc" },
        take: 50,
        include: { user: { select: { id: true, name: true } } },
    });

    return NextResponse.json(
        messages.map((m) => ({
            id: m.id,
            content: m.content,
            createdAt: m.createdAt.toISOString(),
            user: { id: m.user.id, name: m.user.name },
        }))
    );
}
