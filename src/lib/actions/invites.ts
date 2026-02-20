"use server";

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { z } from "zod";

const registerSchema = z.object({
    name: z.string().min(2, "name must be at least 2 characters"),
    email: z.string().email("invalid email"),
    password: z.string().min(8, "password must be at least 8 characters"),
    token: z.string().min(1),
});

export async function registerWithInvite(formData: FormData) {
    const raw = {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        token: formData.get("token") as string,
    };

    const parsed = registerSchema.safeParse(raw);
    if (!parsed.success) {
        return { error: parsed.error.issues[0].message };
    }

    const { name, email, password, token } = parsed.data;

    // Validate invite token
    const invite = await prisma.invite.findUnique({
        where: { token },
    });

    if (!invite) return { error: "invalid invite token." };
    if (invite.revoked) return { error: "this invite has been revoked." };
    if (invite.expiresAt && invite.expiresAt < new Date()) {
        return { error: "this invite has expired." };
    }
    if (invite.singleUse && invite.uses >= 1) {
        return { error: "this invite has already been used." };
    }
    if (invite.maxUses > 0 && invite.uses >= invite.maxUses) {
        return { error: "this invite has reached its use limit." };
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({
        where: { email },
    });
    if (existing) return { error: "email already registered." };

    // Check if email was previously banned (hard ban)
    const previousBan = await prisma.ban.findFirst({
        where: {
            user: { email },
            type: "HARD",
        },
    });
    if (previousBan) {
        return { error: "this email has been permanently banned." };
    }

    // Create user
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
        data: {
            name,
            email,
            passwordHash,
        },
    });

    // Increment invite usage
    await prisma.invite.update({
        where: { id: invite.id },
        data: { uses: { increment: 1 } },
    });

    // Add user to all default spaces
    const defaultSpaces = await prisma.space.findMany({
        where: { isDefault: true },
    });

    for (const space of defaultSpaces) {
        await prisma.spaceMember.create({
            data: {
                userId: user.id,
                spaceId: space.id,
            },
        });
    }

    // Sign in the user
    await signIn("credentials", {
        email,
        password,
        redirect: false,
    });

    redirect("/spaces");
}
