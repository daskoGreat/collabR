"use server";

import { prisma } from "@/lib/db";
import { requireSpaceMember } from "@/lib/auth-guard";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const postSchema = z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(1).max(5000),
    tags: z.string().optional(),
});

export async function createPost(spaceId: string, formData: FormData) {
    const user = await requireSpaceMember(spaceId);
    const raw = {
        title: formData.get("title") as string,
        content: formData.get("content") as string,
        tags: (formData.get("tags") as string) || undefined,
    };

    const parsed = postSchema.safeParse(raw);
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const tags = parsed.data.tags
        ? parsed.data.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

    await prisma.post.create({
        data: {
            spaceId,
            userId: user.id,
            title: parsed.data.title,
            content: parsed.data.content,
            tags,
        },
    });

    revalidatePath(`/spaces/${spaceId}/help`);
}

export async function addAnswer(
    postId: string,
    spaceId: string,
    formData: FormData
) {
    const user = await requireSpaceMember(spaceId);
    const content = formData.get("content") as string;
    if (!content?.trim()) return { error: "answer can't be empty" };

    await prisma.postAnswer.create({
        data: { postId, userId: user.id, content: content.trim() },
    });

    revalidatePath(`/spaces/${spaceId}/help/${postId}`);
}

export async function markPostSolved(postId: string, spaceId: string) {
    await requireSpaceMember(spaceId);
    await prisma.post.update({
        where: { id: postId },
        data: { solved: true },
    });
    revalidatePath(`/spaces/${spaceId}/help/${postId}`);
    revalidatePath(`/spaces/${spaceId}/help`);
}

export async function acceptAnswer(
    answerId: string,
    postId: string,
    spaceId: string
) {
    await requireSpaceMember(spaceId);

    // Unaccept all other answers first
    await prisma.postAnswer.updateMany({
        where: { postId },
        data: { accepted: false },
    });

    await prisma.postAnswer.update({
        where: { id: answerId },
        data: { accepted: true },
    });

    // Also mark the post as solved
    await prisma.post.update({
        where: { id: postId },
        data: { solved: true },
    });

    revalidatePath(`/spaces/${spaceId}/help/${postId}`);
}
