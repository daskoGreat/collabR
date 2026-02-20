import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

function getDirectDatabaseUrl(): string {
    const rawUrl = process.env.DATABASE_URL!;
    if (rawUrl.startsWith("postgres://") || rawUrl.startsWith("postgresql://")) {
        return rawUrl;
    }
    if (rawUrl.startsWith("prisma+postgres://")) {
        const parsed = new URL(rawUrl.replace("prisma+postgres://", "https://"));
        const apiKey = parsed.searchParams.get("api_key");
        if (apiKey) {
            const decoded = JSON.parse(Buffer.from(apiKey, "base64").toString());
            if (decoded.databaseUrl) return decoded.databaseUrl;
        }
    }
    throw new Error("Cannot determine database URL");
}

const adapter = new PrismaPg({ connectionString: getDirectDatabaseUrl() });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Seeding database...");

    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 12);
    const admin = await prisma.user.upsert({
        where: { email: "admin@collab.dev" },
        update: {},
        create: {
            name: "Admin",
            email: "admin@collab.dev",
            passwordHash: adminPassword,
            role: "ADMIN",
        },
    });
    console.log(`  ✓ Admin user: ${admin.email}`);

    // Create a demo member
    const memberPassword = await bcrypt.hash("member123", 12);
    const member = await prisma.user.upsert({
        where: { email: "member@collab.dev" },
        update: {},
        create: {
            name: "DevPerson",
            email: "member@collab.dev",
            passwordHash: memberPassword,
            role: "MEMBER",
        },
    });
    console.log(`  ✓ Member user: ${member.email}`);

    // Create default space
    const space = await prisma.space.upsert({
        where: { id: "default-space" },
        update: {},
        create: {
            id: "default-space",
            name: "General",
            description: "the default space. everyone lands here.",
            isDefault: true,
        },
    });
    console.log(`  ✓ Default space: ${space.name}`);

    // Add members to space
    await prisma.spaceMember.upsert({
        where: { userId_spaceId: { userId: admin.id, spaceId: space.id } },
        update: {},
        create: { userId: admin.id, spaceId: space.id, role: "ADMIN" },
    });
    await prisma.spaceMember.upsert({
        where: { userId_spaceId: { userId: member.id, spaceId: space.id } },
        update: {},
        create: { userId: member.id, spaceId: space.id },
    });

    // Create channels
    const general = await prisma.channel.upsert({
        where: { id: "general-channel" },
        update: {},
        create: {
            id: "general-channel",
            spaceId: space.id,
            name: "general",
            description: "general discussion — anything goes",
        },
    });

    const dev = await prisma.channel.upsert({
        where: { id: "dev-channel" },
        update: {},
        create: {
            id: "dev-channel",
            spaceId: space.id,
            name: "dev",
            description: "code talk, debugging, architecture",
        },
    });

    const random = await prisma.channel.upsert({
        where: { id: "random-channel" },
        update: {},
        create: {
            id: "random-channel",
            spaceId: space.id,
            name: "random",
            description: "off-topic, memes, links, whatever",
        },
    });
    console.log(`  ✓ Channels: ${general.name}, ${dev.name}, ${random.name}`);

    // Create a sample invite
    const invite = await prisma.invite.upsert({
        where: { id: "demo-invite" },
        update: {},
        create: {
            id: "demo-invite",
            token: "demo-invite-token",
            createdBy: admin.id,
            maxUses: 10,
            singleUse: false,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
    });
    console.log(`  ✓ Demo invite token: ${invite.token}`);
    console.log(`    → Use: http://localhost:3000/invite/${invite.token}`);

    // Create a sample task
    await prisma.task.upsert({
        where: { id: "sample-task" },
        update: {},
        create: {
            id: "sample-task",
            spaceId: space.id,
            title: "Set up development environment",
            description: "Get the local dev environment running with all dependencies. Document any gotchas.",
            status: "OPEN",
            tags: ["onboarding", "docs"],
            createdBy: admin.id,
            assigneeId: member.id,
        },
    });
    console.log("  ✓ Sample task created");

    // Create a sample post
    await prisma.post.upsert({
        where: { id: "sample-post" },
        update: {},
        create: {
            id: "sample-post",
            spaceId: space.id,
            userId: member.id,
            title: "How do I connect to the database locally?",
            content: "I'm trying to set up my local dev environment but can't figure out the DATABASE_URL format for Neon. Anyone got a working example?",
            tags: ["help", "database", "setup"],
        },
    });
    console.log("  ✓ Sample question created");

    // Seed some messages
    await prisma.message.createMany({
        data: [
            {
                channelId: general.id,
                userId: admin.id,
                content: "welcome to collab. this is a safe space — ask anything, help generously.",
            },
            {
                channelId: general.id,
                userId: member.id,
                content: "hey! stoked to be here. 🚀",
            },
            {
                channelId: dev.id,
                userId: admin.id,
                content: "drop your dev questions in here. no judgment, only answers.",
            },
        ],
        skipDuplicates: true,
    });
    console.log("  ✓ Sample messages created");

    console.log("\n✅ Seed complete!");
    console.log("\n📋 Login credentials:");
    console.log("  Admin: admin@collab.dev / admin123");
    console.log("  Member: member@collab.dev / member123");
    console.log(`\n🔗 Invite link: http://localhost:3000/invite/${invite.token}`);
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
