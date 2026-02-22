import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error("DATABASE_URL environment variable is not set");
    process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Migrating existing threads...");

    // Check if the members model is available
    try {
        const threads = await prisma.directThread.findMany({
            where: {
                members: { none: {} }
            }
        });

        console.log(`Found ${threads.length} threads to migrate.`);

        for (const thread of threads) {
            if (thread.user1Id && thread.user2Id) {
                // Check if members already exist for this thread (extra safety)
                const existingMembers = await prisma.threadMember.count({
                    where: { threadId: thread.id }
                });

                if (existingMembers === 0) {
                    await prisma.threadMember.createMany({
                        data: [
                            { threadId: thread.id, userId: thread.user1Id, role: "OWNER" },
                            { threadId: thread.id, userId: thread.user2Id, role: "MEMBER" }
                        ]
                    });
                    console.log(`Migrated thread ${thread.id}`);
                }
            }
        }
    } catch (err) {
        console.error("Migration failed during query:", err);
    }

    console.log("Migration complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
