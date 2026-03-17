"use server";

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";
import { z } from "zod";
import { redirect } from "next/navigation";

const selfRegisterSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_\-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
    email: z.string().email("Invalid email address"),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
    category: z.string().optional(),
});

export async function selfRegister(formData: FormData) {
    try {
        const rawData = {
            name: formData.get("name") as string,
            username: formData.get("username") as string,
            email: formData.get("email") as string,
            password: formData.get("password") as string,
            category: formData.get("category") as string,
        };

        const validatedData = selfRegisterSchema.parse(rawData);

        // Check if email or username already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: validatedData.email },
                    { username: validatedData.username }
                ]
            },
        });

        if (existingUser) {
            if (existingUser.email === validatedData.email) {
                return { success: false, error: "Email already registered. Please sign in." };
            }
            return { success: false, error: "Username already taken." };
        }

        const passwordHash = await bcrypt.hash(validatedData.password, 12);

        // Use a transaction to ensure all related records are created
        const user = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    name: validatedData.name,
                    email: validatedData.email,
                    username: validatedData.username,
                    passwordHash: passwordHash,
                },
            });

            // Create initial profile
            await tx.profile.create({
                data: {
                    userId: newUser.id,
                    supportPreferences: validatedData.category,
                }
            });

            // Create default avatar config
            await tx.avatarConfig.create({
                data: {
                    userId: newUser.id,
                }
            });

            // Add user to all default spaces
            const defaultSpaces = await tx.space.findMany({
                where: { isDefault: true },
            });

            for (const space of defaultSpaces) {
                await tx.spaceMember.create({
                    data: {
                        userId: newUser.id,
                        spaceId: space.id,
                    },
                });
            }

            return newUser;
        });

        // Sign in the user
        await signIn("credentials", {
            email: validatedData.email,
            password: validatedData.password,
            redirect: false,
        });

        return { success: true };
    } catch (error) {
        console.error("Registration failed:", error);
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return { success: false, error: "An unexpected error occurred." };
    }
}
