"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";

export async function createInvite(formData: FormData) {
    const user = await requireRole("ADMIN");

    const maxUses = parseInt(formData.get("maxUses") as string) || 1;
    const singleUse = formData.get("singleUse") === "on";
    const expiresInDays = parseInt(formData.get("expiresInDays") as string) || 0;
    const email = (formData.get("email") as string)?.trim() || null;

    const expiresAt = expiresInDays > 0
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null;

    if (email) {
        // Revoke any existing invites for this email
        await prisma.invite.updateMany({
            where: { email, revoked: false },
            data: { revoked: true }
        });
    }

    const invite = await prisma.invite.create({
        data: {
            token: nanoid(24),
            email,
            createdBy: user.id,
            maxUses: singleUse ? 1 : maxUses,
            singleUse,
            expiresAt,
            userId: formData.get("userId") as string || null,
        },
    });

    await prisma.auditLog.create({
        data: {
            userId: user.id,
            action: "invite.create",
            targetType: "invite",
            targetId: invite.id,
            metadata: { token: invite.token, maxUses: invite.maxUses },
        },
    });

    revalidatePath("/admin/invites");
    return { token: invite.token };
}

export async function revokeInvite(inviteId: string) {
    const user = await requireRole("ADMIN");

    await prisma.invite.update({
        where: { id: inviteId },
        data: { revoked: true },
    });

    await prisma.auditLog.create({
        data: {
            userId: user.id,
            action: "invite.revoke",
            targetType: "invite",
            targetId: inviteId,
        },
    });

    revalidatePath("/admin/invites");
}

export async function reinviteUser(email: string) {
    const user = await requireRole("ADMIN");

    // Revoke any existing
    await prisma.invite.updateMany({
        where: { email, revoked: false },
        data: { revoked: true }
    });

    // Create new invite (7 days expiration by default for re-invites)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await prisma.invite.create({
        data: {
            token: nanoid(24),
            email,
            createdBy: user.id,
            maxUses: 1,
            singleUse: true,
            expiresAt,
        },
    });

    await prisma.auditLog.create({
        data: {
            userId: user.id,
            action: "invite.reinvite",
            targetType: "invite",
            targetId: invite.id,
            metadata: { email, token: invite.token },
        },
    });

    revalidatePath("/admin/invites");
    return { token: invite.token };
}

export async function banUser(formData: FormData) {
    const admin = await requireRole("ADMIN");

    const userId = formData.get("userId") as string;
    const reason = formData.get("reason") as string;
    const type = (formData.get("type") as string) === "HARD" ? "HARD" : "SOFT";

    if (!userId || !reason) return { error: "userId and reason are required" };

    // Create ban record
    await prisma.ban.create({
        data: {
            userId,
            reason,
            bannedBy: admin.id,
            type: type as "SOFT" | "HARD",
        },
    });

    // Update user
    await prisma.user.update({
        where: { id: userId },
        data: { banned: true, bannedReason: reason },
    });

    await prisma.auditLog.create({
        data: {
            userId: admin.id,
            action: "user.ban",
            targetType: "user",
            targetId: userId,
            metadata: { reason, type },
        },
    });

    revalidatePath("/admin/users");
}

export async function unbanUser(userId: string) {
    const admin = await requireRole("ADMIN");

    await prisma.user.update({
        where: { id: userId },
        data: { banned: false, bannedReason: null },
    });

    await prisma.auditLog.create({
        data: {
            userId: admin.id,
            action: "user.unban",
            targetType: "user",
            targetId: userId,
        },
    });

    revalidatePath("/admin/users");
}

export async function changeUserRole(userId: string, role: "ADMIN" | "MODERATOR" | "MEMBER") {
    const admin = await requireRole("ADMIN");

    await prisma.user.update({
        where: { id: userId },
        data: { role },
    });

    await prisma.auditLog.create({
        data: {
            userId: admin.id,
            action: "user.role_change",
            targetType: "user",
            targetId: userId,
            metadata: { newRole: role },
        },
    });

    revalidatePath("/admin/users");
}

export async function resolveReport(reportId: string, action: "resolve" | "dismiss") {
    const admin = await requireRole("ADMIN", "MODERATOR");

    await prisma.report.update({
        where: { id: reportId },
        data: {
            status: action === "resolve" ? "RESOLVED" : "DISMISSED",
            resolvedBy: admin.id,
            resolvedAt: new Date(),
        },
    });

    await prisma.auditLog.create({
        data: {
            userId: admin.id,
            action: `report.${action}`,
            targetType: "report",
            targetId: reportId,
        },
    });

    revalidatePath("/admin/reports");
}

export async function deleteMessage(messageId: string) {
    const admin = await requireRole("ADMIN", "MODERATOR");

    await prisma.message.update({
        where: { id: messageId },
        data: { deletedAt: new Date() },
    });

    await prisma.auditLog.create({
        data: {
            userId: admin.id,
            action: "message.delete",
            targetType: "message",
            targetId: messageId,
        },
    });
}

export async function createSpace(formData: FormData) {
    const admin = await requireRole("ADMIN");

    const name = formData.get("name") as string;
    const description = (formData.get("description") as string) || null;
    const isDefault = formData.get("isDefault") === "on";

    if (!name?.trim()) return { error: "name is required" };

    const space = await prisma.space.create({
        data: { name: name.trim(), description, isDefault },
    });

    // Add admin as member
    await prisma.spaceMember.create({
        data: { userId: admin.id, spaceId: space.id, role: "ADMIN" },
    });

    // Create a default general channel
    await prisma.channel.create({
        data: { spaceId: space.id, name: "general", description: "general discussion" },
    });

    await prisma.auditLog.create({
        data: {
            userId: admin.id,
            action: "space.create",
            targetType: "space",
            targetId: space.id,
            metadata: { name: space.name },
        },
    });

    revalidatePath("/spaces");
    revalidatePath("/admin");
}

export async function createReport(formData: FormData) {
    const reporterId = formData.get("reporterId") as string;
    const targetType = formData.get("targetType") as string;
    const targetId = formData.get("targetId") as string;
    const reason = formData.get("reason") as string;

    if (!reporterId || !targetType || !targetId || !reason) {
        return { error: "all fields required" };
    }

    await prisma.report.create({
        data: { reporterId, targetType, targetId, reason },
    });

    revalidatePath("/admin/reports");
}

export async function inviteNewUser(formData: FormData) {
    const admin = await requireRole("ADMIN");

    const name = formData.get("name") as string;
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const role = (formData.get("role") as string) || "MEMBER";

    if (!name || !email) return { error: "name and email are required" };

    // Check if user already exists
    let userRecord = await prisma.user.findUnique({ where: { email } });

    if (userRecord && userRecord.passwordHash) {
        return { error: "user already active" };
    }

    if (!userRecord) {
        // Create pending user
        userRecord = await prisma.user.create({
            data: {
                name,
                email,
                role: role as any,
                passwordHash: null, // Pending status
            }
        });

        // Add to default spaces
        const defaultSpaces = await prisma.space.findMany({ where: { isDefault: true } });
        for (const space of defaultSpaces) {
            await prisma.spaceMember.create({
                data: { userId: userRecord.id, spaceId: space.id }
            });
        }
    }

    // Revoke old invites
    await prisma.invite.updateMany({
        where: { userId: userRecord.id, revoked: false },
        data: { revoked: true }
    });

    // Create new invite
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const invite = await prisma.invite.create({
        data: {
            token: nanoid(24),
            userId: userRecord.id,
            email,
            createdBy: admin.id,
            expiresAt,
        }
    });

    await prisma.auditLog.create({
        data: {
            userId: admin.id,
            action: "user.invite",
            targetType: "user",
            targetId: userRecord.id,
            metadata: { token: invite.token }
        }
    });

    revalidatePath("/admin/users");
    return { token: invite.token };
}

export async function regenerateUserInvite(userId: string) {
    const admin = await requireRole("ADMIN");

    const userRecord = await prisma.user.findUnique({ where: { id: userId } });
    if (!userRecord || userRecord.passwordHash) return { error: "invalid user" };

    // Revoke old
    await prisma.invite.updateMany({
        where: { userId, revoked: false },
        data: { revoked: true }
    });

    // New invite
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const invite = await prisma.invite.create({
        data: {
            token: nanoid(24),
            userId,
            email: userRecord.email,
            createdBy: admin.id,
            expiresAt,
        }
    });

    revalidatePath("/admin/users");
    return { token: invite.token };
}

export async function deleteUser(userId: string) {
    const admin = await requireRole("ADMIN");

    if (userId === admin.id) {
        return { error: "you cannot delete your own account." };
    }

    // Capture user info for audit log before deletion
    const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true }
    });

    if (!targetUser) {
        return { error: "user not found." };
    }

    // Audit log entry
    await prisma.auditLog.create({
        data: {
            userId: admin.id,
            action: "user.delete",
            targetType: "user",
            targetId: userId,
            metadata: { email: targetUser.email, name: targetUser.name }
        }
    });

    // Delete the user - Prisma will handle relations due to Cascade
    await prisma.user.delete({
        where: { id: userId }
    });

    revalidatePath("/admin/users");
    return { success: true };
}
