import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = "postgresql://neondb_owner:npg_fQCx8ZEFwes7@ep-odd-wave-ab8p3hpa-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require";

async function main() {
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    const emails = ['davidskoglund02@gmail.com', 'david.skoglund@greatit.se'];

    console.log('Searching for users and requests to delete...');

    for (const email of emails) {
        // Delete User
        try {
            const deletedUser = await prisma.user.delete({ where: { email } });
            console.log(`Deleted user: ${email} (${deletedUser.id})`);
        } catch (e) {
            console.log(`User not found or already deleted: ${email}`);
        }

        // Delete JoinRequests
        try {
            const result = await prisma.joinRequest.deleteMany({ where: { email } });
            console.log(`Deleted ${result.count} join requests for: ${email}`);
        } catch (e) {
            console.log(`Error deleting requests for ${email}:`, e);
        }
    }

    await prisma.$disconnect();
    await pool.end();
}

main().catch(console.error);
