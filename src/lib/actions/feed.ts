"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const feedPostSchema = z.object({
    content: z.string().min(1).max(10000),
});

async function requireUser() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return session.user as { id: string, name: string };
}

export async function createFeedPost(formData: FormData) {
    const user = await requireUser();
    const content = formData.get("content") as string;

    const parsed = feedPostSchema.safeParse({ content });
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const attachmentsJson = formData.get("attachments") as string;
    let attachments: { name: string, url: string, mimeType: string, size: number }[] = [];
    if (attachmentsJson) {
        try {
            attachments = JSON.parse(attachmentsJson);
        } catch (e) {
            console.error("Failed to parse attachments JSON", e);
        }
    }

    const post = await prisma.feedPost.create({
        data: {
            userId: user.id,
            content: parsed.data.content,
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
    await handleFeedMentions(parsed.data.content, post.id, "post");

    revalidatePath("/feed");
    return { success: true, id: post.id };
}

export async function addFeedComment(postId: string, formData: FormData) {
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

    const comment = await prisma.feedComment.create({
        data: {
            feedPostId: postId,
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
    await handleFeedMentions(content, comment.id, "comment");

    revalidatePath("/feed");
    return { success: true };
}

export async function toggleFeedReaction(postId: string, type: string) {
    const user = await requireUser();

    const existing = await prisma.feedReaction.findUnique({
        where: {
            feedPostId_userId_type: {
                feedPostId: postId,
                userId: user.id,
                type
            }
        }
    });

    if (existing) {
        await prisma.feedReaction.delete({
            where: { id: existing.id }
        });
    } else {
        await prisma.feedReaction.create({
            data: {
                feedPostId: postId,
                userId: user.id,
                type
            }
        });
    }

    revalidatePath("/feed");
    return { success: true };
}

async function handleFeedMentions(content: string, targetId: string, type: "post" | "comment") {
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
                feedPostId: type === "post" ? targetId : undefined,
                feedCommentId: type === "comment" ? targetId : undefined
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
                    type: `feed-${type}`,
                    content: content.slice(0, 100) + (content.length > 100 ? "..." : ""),
                    fromName: session?.user?.name || "Someone"
                });
            }
        } catch (err) {
            console.error("Mention pusher trigger failed:", err);
        }
    }
}

export async function deleteFeedPost(id: string) {
    const user = await requireUser();
    const post = await prisma.feedPost.findUnique({ where: { id } });
    if (!post || (post.userId !== user.id)) {
        throw new Error("Unauthorized or not found");
    }

    await prisma.feedPost.delete({ where: { id } });
    revalidatePath("/feed");
    return { success: true };
}
