"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const opportunitySchema = z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(1).max(5000),
    type: z.enum(["JOBB", "LIA", "UPPDRAG"]),
    location: z.enum(["REMOTE", "HYBRID", "ONSITE"]),
    tags: z.string().optional(),
    link: z.string().url().optional().or(z.literal("")),
    contactInfo: z.string().optional(),
    deadline: z.string().optional(),
});

async function requireUser() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return session.user as { id: string, name: string };
}

export async function createOpportunity(formData: FormData) {
    const user = await requireUser();
    const raw = {
        title: formData.get("title") as string,
        content: formData.get("content") as string,
        type: formData.get("type") as any,
        location: formData.get("location") as any,
        tags: (formData.get("tags") as string) || undefined,
        link: (formData.get("link") as string) || undefined,
        contactInfo: (formData.get("contactInfo") as string) || undefined,
        deadline: (formData.get("deadline") as string) || undefined,
    };

    const parsed = opportunitySchema.safeParse(raw);
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const tags = parsed.data.tags
        ? parsed.data.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

    const attachmentsJson = formData.get("attachments") as string;
    let attachments: { name: string, url: string, mimeType: string, size: number }[] = [];
    if (attachmentsJson) {
        try {
            attachments = JSON.parse(attachmentsJson);
        } catch (e) {
            console.error("Failed to parse attachments JSON", e);
        }
    }

    const opportunity = await prisma.opportunity.create({
        data: {
            userId: user.id,
            title: parsed.data.title,
            content: parsed.data.content,
            type: parsed.data.type,
            location: parsed.data.location,
            tags,
            link: parsed.data.link || null,
            contactInfo: parsed.data.contactInfo || null,
            deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
            attachments: attachments.length > 0 ? {
                create: attachments.map(a => ({
                    name: a.name,
                    url: a.url,
                    mimeType: a.mimeType,
                    size: a.size,
                    storageKey: a.url.split("/").pop() || "unknown",
                }))
            } : undefined
        },
    });

    // Handle mentions in content
    await handleMentions(parsed.data.content, opportunity.id, "opportunity");

    revalidatePath("/opportunities");
    return { success: true, id: opportunity.id };
}

export async function addOpportunityComment(opportunityId: string, formData: FormData) {
    const user = await requireUser();
    const content = formData.get("content") as string;
    const attachmentsJson = formData.get("attachments") as string;

    if (!content?.trim() && !attachmentsJson) return { error: "comment can't be empty" };

    let attachments: { name: string, url: string, mimeType: string, size: number }[] = [];
    if (attachmentsJson) {
        try {
            attachments = JSON.parse(attachmentsJson);
        } catch (e) {
            console.error("Failed to parse attachments JSON", e);
        }
    }

    const comment = await prisma.opportunityComment.create({
        data: {
            opportunityId,
            userId: user.id,
            content: content.trim(),
            attachments: attachments.length > 0 ? {
                create: attachments.map(a => ({
                    name: a.name,
                    url: a.url,
                    mimeType: a.mimeType,
                    size: a.size,
                    storageKey: a.url.split("/").pop() || "unknown",
                }))
            } : undefined
        },
    });

    // Handle mentions in comment
    await handleMentions(content, comment.id, "comment");

    revalidatePath(`/opportunities/${opportunityId}`);
    return { success: true };
}

async function handleMentions(content: string, targetId: string, type: "opportunity" | "comment") {
    const mentionMatches = content.match(/@([\w\s.ÅÄÖåäö]+?)(?=\s|$|[,.!?])/g);
    if (!mentionMatches) return;

    const names = mentionMatches.map(m => m.slice(1).trim());
    const mentionedUsers = await prisma.user.findMany({
        where: { name: { in: names } },
        select: { id: true }
    });

    if (mentionedUsers.length > 0) {
        await prisma.mention.createMany({
            data: mentionedUsers.map(u => ({
                userId: u.id,
                opportunityId: type === "opportunity" ? targetId : undefined,
                opportunityCommentId: type === "comment" ? targetId : undefined
            }))
        });

        // Trigger Pusher for mentions
        try {
            const { getPusherServer } = await import("@/lib/pusher-server");
            const pusher = getPusherServer();
            const session = await auth();
            for (const u of mentionedUsers) {
                if (u.id === session?.user?.id) continue;
                await pusher.trigger(`user-${u.id}`, "new-mention", {
                    targetId,
                    type: `opportunity-${type}`,
                    content: content.slice(0, 100) + (content.length > 100 ? "..." : ""),
                    fromName: session?.user?.name || "Someone"
                });
            }
        } catch (err) {
            console.error("Mention pusher trigger failed:", err);
        }
    }
}

export async function deleteOpportunity(id: string) {
    const user = await requireUser();
    const opportunity = await prisma.opportunity.findUnique({ where: { id } });
    if (!opportunity || (opportunity.userId !== user.id)) {
        throw new Error("Unauthorized or not found");
    }

    await prisma.opportunity.delete({ where: { id } });
    revalidatePath("/opportunities");
    return { success: true };
}
