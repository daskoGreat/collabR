import { prisma } from "./src/lib/db";

async function main() {
    const spaces = await prisma.space.findMany({
        include: {
            channels: true
        }
    });

    console.log(JSON.stringify(spaces, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
