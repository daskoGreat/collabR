"use server";

import { prisma } from "@/lib/db";
import { requireSpaceMember } from "@/lib/auth-guard";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const taskSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    tags: z.string().optional(),
    assigneeId: z.string().optional(),
});

export async function createTask(spaceId: string, formData: FormData) {
    const user = await requireSpaceMember(spaceId);
    const raw = {
        title: formData.get("title") as string,
        description: (formData.get("description") as string) || undefined,
        tags: (formData.get("tags") as string) || undefined,
        assigneeId: (formData.get("assigneeId") as string) || undefined,
    };

    const parsed = taskSchema.safeParse(raw);
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const tags = parsed.data.tags
        ? parsed.data.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

    await prisma.task.create({
        data: {
            spaceId,
            title: parsed.data.title,
            description: parsed.data.description || null,
            tags,
            assigneeId: parsed.data.assigneeId || null,
            createdBy: user.id,
        },
    });

    revalidatePath(`/spaces/${spaceId}/tasks`);
    revalidatePath(`/spaces/${spaceId}`);
}

export async function updateTaskStatus(
    taskId: string,
    spaceId: string,
    status: "OPEN" | "IN_PROGRESS" | "DONE"
) {
    await requireSpaceMember(spaceId);
    await prisma.task.update({
        where: { id: taskId },
        data: { status },
    });
    revalidatePath(`/spaces/${spaceId}/tasks`);
    revalidatePath(`/spaces/${spaceId}/tasks/${taskId}`);
}

export async function addTaskComment(
    taskId: string,
    spaceId: string,
    formData: FormData
) {
    const user = await requireSpaceMember(spaceId);
    const content = formData.get("content") as string;
    if (!content?.trim()) return { error: "comment can't be empty" };

    await prisma.taskComment.create({
        data: { taskId, userId: user.id, content: content.trim() },
    });

    revalidatePath(`/spaces/${spaceId}/tasks/${taskId}`);
}

export async function deleteTask(taskId: string, spaceId: string) {
    await requireSpaceMember(spaceId);
    await prisma.task.delete({ where: { id: taskId } });
    revalidatePath(`/spaces/${spaceId}/tasks`);
}
