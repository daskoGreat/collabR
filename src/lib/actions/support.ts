"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function ensureSupportInfrastructure() {
    const session = await auth();
    if (!session?.user?.id) return { error: "unauthorized" };

    try {
        // 1. Ensure Support Space exists
        const space = await prisma.space.upsert({
            where: { id: "support-network" },
            update: {},
            create: {
                id: "support-network",
                name: "Support Network",
                description: "The primary space for community support and guidance.",
                isDefault: false, // We keep it hidden from the main collab dashboard
            },
        });

        // 2. Ensure current user is a member of the support space
        await prisma.spaceMember.upsert({
            where: {
                userId_spaceId: {
                    userId: session.user.id,
                    spaceId: space.id,
                },
            },
            update: {},
            create: {
                userId: session.user.id,
                spaceId: space.id,
                role: "MEMBER",
            },
        });

        // 3. Define the essential channels for each area
        const channels = [
            // Community
            { id: "community-general", name: "General Support", description: "General help and sharing." },
            { id: "community-life", name: "Life Challenges", description: "Discussing life's hurdles." },
            { id: "community-career", name: "Career Discussions", description: "Career growth and transitions." },
            { id: "community-growth", name: "Personal Growth", description: "Ways to better ourselves." },
            { id: "community-intro", name: "Introductions", description: "Meet the community." },

            // Psychological
            { id: "psych-anxiety", name: "Anxiety Support", description: "Managing anxiety." },
            { id: "psych-stress", name: "Stress Management", description: "Navigating stress." },
            { id: "psych-transitions", name: "Life Transitions", description: "Navigating major changes." },
            { id: "psych-burnout", name: "Burnout Recovery", description: "Recovering from burnout." },

            // Spiritual
            { id: "spirit-meditation", name: "Meditation Discussions", description: "Sharing techniques." },
            { id: "spirit-growth", name: "Inner Growth", description: "Journey of the self." },
            { id: "spirit-philosophy", name: "Philosophy Conversations", description: "Deep questions." },
            { id: "spirit-mindfulness", name: "Mindfulness Practices", description: "Applying awareness." },
        ];

        for (const ch of channels) {
            await prisma.channel.upsert({
                where: { id: ch.id },
                update: {
                    name: ch.name,
                    description: ch.description,
                },
                create: {
                    id: ch.id,
                    spaceId: space.id,
                    name: ch.name,
                    description: ch.description,
                },
            });

            // Ensure user is a member of each channel (if needed by current API)
            // Some APIs require explicit channel membership
            await prisma.channelMember.upsert({
                where: {
                    channelId_userId: {
                        channelId: ch.id,
                        userId: session.user.id,
                    },
                },
                update: {},
                create: {
                    channelId: ch.id,
                    userId: session.user.id,
                },
            });
        }

        // 4. Ensure Coach Users exist
        const coaches = [
            { id: "coach-1", name: "Dr. Elena Vance", email: "elena@support.net" },
            { id: "coach-2", name: "Marcus Aurelius", email: "marcus@support.net" },
            { id: "coach-3", name: "Sarah Chen", email: "sarah@support.net" },
        ];

        for (const coach of coaches) {
            await prisma.user.upsert({
                where: { email: coach.email },
                update: { name: coach.name },
                create: {
                    id: coach.id,
                    email: coach.email,
                    name: coach.name,
                    role: "MEMBER",
                },
            });
        }

        return { success: true, spaceId: space.id };
    } catch (error) {
        console.error("Failed to ensure support infrastructure:", error);
        return { error: "failed to initialize" };
    }
}
