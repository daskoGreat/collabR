import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Simple in-memory rate limiter
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string, limit = 20, windowMs = 60000): boolean {
    const now = Date.now();
    const entry = rateLimits.get(userId);

    if (!entry || now > entry.resetAt) {
        rateLimits.set(userId, { count: 1, resetAt: now + windowMs });
        return true;
    }

    if (entry.count >= limit) return false;
    entry.count++;
    return true;
}

const sendSchema = z.object({
    channelId: z.string(),
    spaceId: z.string(),
    content: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Rate limit
    if (!checkRateLimit(userId)) {
        return NextResponse.json(
            { error: "slow down. rate limit exceeded." },
            { status: 429 }
        );
    }

    const body = await req.json();
    const parsed = sendSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0].message },
            { status: 400 }
        );
    }

    const { channelId, spaceId, content } = parsed.data;

    // Verify space membership
    const userRole = (session.user as { role: string }).role;
    if (userRole !== "ADMIN") {
        const membership = await prisma.spaceMember.findUnique({
            where: { userId_spaceId: { userId, spaceId } },
        });
        if (!membership) {
            return NextResponse.json({ error: "not a member" }, { status: 403 });
        }
    }

    // Verify channel belongs to space
    const channel = await prisma.channel.findUnique({
        where: { id: channelId },
    });
    if (!channel || channel.spaceId !== spaceId) {
        return NextResponse.json({ error: "channel not found" }, { status: 404 });
    }

    // Save message
    const message = await prisma.message.create({
        data: { channelId, userId, content },
        include: { user: { select: { id: true, name: true } } },
    });

    // Broadcast via Pusher (best-effort, don't block on failure)
    try {
        const { getPusherServer } = await import("@/lib/pusher-server");
        const pusher = getPusherServer();
        await pusher.trigger(`channel-${channelId}`, "new-message", {
            id: message.id,
            content: message.content,
            createdAt: message.createdAt.toISOString(),
            user: message.user,
        });
    } catch {
        // Pusher not configured or failed — message is still saved
    }

    return NextResponse.json({ id: message.id }, { status: 201 });
}
