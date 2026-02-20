import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export type SessionUser = {
    id: string;
    name: string;
    email: string;
    role: string;
};

export async function requireAuth(): Promise<SessionUser> {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }
    return session.user as SessionUser;
}

export async function requireRole(
    ...roles: string[]
): Promise<SessionUser> {
    const user = await requireAuth();
    if (!roles.includes(user.role)) {
        redirect("/spaces");
    }
    return user;
}

export async function requireSpaceMember(
    spaceId: string
): Promise<SessionUser> {
    const user = await requireAuth();

    // Admins can access all spaces
    if (user.role === "ADMIN") return user;

    const membership = await prisma.spaceMember.findUnique({
        where: {
            userId_spaceId: {
                userId: user.id,
                spaceId,
            },
        },
    });

    if (!membership) {
        redirect("/spaces");
    }

    return user;
}

export async function requireSpaceRole(
    spaceId: string,
    ...roles: string[]
): Promise<SessionUser> {
    const user = await requireAuth();

    if (user.role === "ADMIN") return user;

    const membership = await prisma.spaceMember.findUnique({
        where: {
            userId_spaceId: {
                userId: user.id,
                spaceId,
            },
        },
    });

    if (!membership || !roles.includes(membership.role)) {
        redirect("/spaces");
    }

    return user;
}
