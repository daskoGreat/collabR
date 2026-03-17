"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getAvatarConfig() {
    const session = await auth();
    if (!session?.user?.id) return { error: "unauthorized" };

    try {
        const config = await prisma.avatarConfig.findUnique({
            where: { userId: session.user.id },
        });

        if (!config) {
            // Create default if not exists
            return await prisma.avatarConfig.create({
                data: { userId: session.user.id, avatarId: "default" },
            });
        }

        return config;
    } catch (error) {
        console.error("Failed to fetch avatar config:", error);
        return { error: "failed to fetch" };
    }
}

export async function saveAvatarConfig(data: { avatarId: string }) {
    const session = await auth();
    if (!session?.user?.id) return { error: "unauthorized" };

    try {
        const config = await prisma.avatarConfig.upsert({
            where: { userId: session.user.id },
            update: {
                avatarId: data.avatarId,
                userId: session.user.id,
            },
            create: {
                avatarId: data.avatarId,
                userId: session.user.id,
            },
        });

        revalidatePath("/network");
        revalidatePath("/profile");
        return { success: true, config };
    } catch (error) {
        console.error("Failed to save avatar config:", error);
        return { error: "failed to save" };
    }
}
