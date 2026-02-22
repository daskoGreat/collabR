import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") ?? "";
    const spaceId = searchParams.get("spaceId");

    if (query.length < 1) {
        return NextResponse.json([]);
    }

    try {
        let users;

        if (spaceId) {
            // Search within a specific space
            const memberships = await prisma.spaceMember.findMany({
                where: {
                    spaceId,
                    user: {
                        OR: [
                            { name: { contains: query, mode: "insensitive" } },
                            { email: { contains: query, mode: "insensitive" } },
                        ],
                    },
                },
                include: { user: { select: { id: true, name: true, email: true } } },
                take: 5,
            });
            users = memberships.map(m => m.user);
        } else {
            // Global search (e.g. for DMs)
            users = await prisma.user.findMany({
                where: {
                    OR: [
                        { name: { contains: query, mode: "insensitive" } },
                        { email: { contains: query, mode: "insensitive" } },
                    ],
                },
                select: { id: true, name: true, email: true },
                take: 5,
            });
        }

        return NextResponse.json(users);
    } catch (err) {
        console.error("Search failed:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
