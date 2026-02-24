"use server";

import { prisma } from "@/lib/db";
import { z } from "zod";
import { getPusherServer } from "@/lib/pusher-server";

const requestAccessSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    message: z.string().optional(),
});

export async function requestAccess(formData: FormData) {
    try {
        const rawData = {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            message: formData.get("message") ? formData.get("message") as string : undefined,
        };

        const validatedData = requestAccessSchema.parse(rawData);

        // Check if a request from this email already exists
        const existingRequest = await prisma.joinRequest.findFirst({
            where: { email: validatedData.email },
        });

        if (existingRequest) {
            return {
                success: false,
                error: "We've already received a request from this email. We'll be in touch!"
            };
        }

        // Also check if they are already a user
        const existingUser = await prisma.user.findUnique({
            where: { email: validatedData.email },
        });

        if (existingUser) {
            return {
                success: false,
                error: "You already have an account. Please log in.",
            }
        }

        const request = await prisma.joinRequest.create({
            data: {
                name: validatedData.name,
                email: validatedData.email,
                message: validatedData.message,
            },
        });

        // Trigger real-time update for admins
        const pusher = getPusherServer();
        await pusher.trigger("admin", "new-join-request", request);

        return { success: true };
    } catch (error) {
        console.error("Failed to submit request:", error);
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return { success: false, error: "Ett oväntat fel uppstod. Försök igen." };
    }
}
