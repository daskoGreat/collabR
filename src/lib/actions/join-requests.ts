"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import { sendInviteEmail } from "@/lib/email";

export async function getPendingRequests() {
    await requireRole("ADMIN", "MODERATOR");

    try {
        const requests = await prisma.joinRequest.findMany({
            where: { status: "PENDING" },
            orderBy: { createdAt: "desc" },
        });
        return { success: true, requests };
    } catch (error) {
        console.error("Error fetching requests:", error);
        return { success: false, error: "Failed to fetch requests" };
    }
}

export async function approveRequest(id: string) {
    const admin = await requireRole("ADMIN", "MODERATOR");

    try {
        const request = await prisma.joinRequest.findUnique({
            where: { id },
        });

        if (!request) {
            return { success: false, error: "Request not found" };
        }

        // 1. Mark request as APPROVED
        await prisma.joinRequest.update({
            where: { id },
            data: { status: "APPROVED" },
        });

        // 2. Generate a single-use invite link for this email
        const invite = await prisma.invite.create({
            data: {
                createdBy: admin.id,
                email: request.email,
                singleUse: true,
                maxUses: 1,
            },
        });

        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === 'production' ? 'https://collab-nine-gold.vercel.app' : 'http://localhost:3000')}/invite/${invite.token}`;

        // 3. Send invitation email via Resend
        const emailResult = await sendInviteEmail({
            email: request.email,
            name: request.name,
            inviteLink: inviteUrl
        });

        revalidatePath("/admin/requests");

        if (emailResult.success) {
            return {
                success: true,
                message: "Request approved and invitation email sent.",
                inviteUrl
            };
        } else {
            console.error("Email delivery failed after approval:", emailResult.error);
            return {
                success: true,
                message: "Request approved, but email delivery failed. Please copy the link manually.",
                inviteUrl,
                emailError: emailResult.error
            };
        }

    } catch (error) {
        console.error("Error approving request:", error);
        return { success: false, error: "Failed to approve request" };
    }
}

export async function denyRequest(id: string) {
    await requireRole("ADMIN", "MODERATOR");

    try {
        await prisma.joinRequest.update({
            where: { id },
            data: { status: "DENIED" },
        });

        revalidatePath("/admin/requests");

        return { success: true };
    } catch (error) {
        console.error("Error denying request:", error);
        return { success: false, error: "Failed to deny request" };
    }
}
