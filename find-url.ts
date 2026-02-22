import { prisma } from "./src/lib/db";

async function main() {
    const attachment = await prisma.attachment.findFirst({
        orderBy: { createdAt: "desc" }
    });
    if (attachment) {
        console.log("Found attachment:");
        console.log(JSON.stringify(attachment, null, 2));
    } else {
        console.log("No attachments found");
    }
}

main().finally(() => prisma.$disconnect());
