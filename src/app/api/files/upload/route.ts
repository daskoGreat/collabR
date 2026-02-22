import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { put } from "@vercel/blob";

const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "application/pdf",
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/json",
    "application/zip",
    "application/gzip",
    "application/x-tar",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const spaceId = formData.get("spaceId") as string | null;

    if (!file) {
        return NextResponse.json({ error: "file required" }, { status: 400 });
    }

    // Identify if this is a "Space File" (needs registration in File model)
    // or just a chat attachment (handled by Attachment model in other routes)
    const isSpaceFile = spaceId && spaceId !== "dm";

    if (isSpaceFile) {
        // Check membership only for actual space files
        const userRole = (session.user as { role: string }).role;
        if (userRole !== "ADMIN") {
            const membership = await prisma.spaceMember.findUnique({
                where: { userId_spaceId: { userId: session.user.id, spaceId } },
            });
            if (!membership) {
                return NextResponse.json({ error: "not a member" }, { status: 403 });
            }
        }
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
            { error: `file type '${file.type}' not allowed.` },
            { status: 400 }
        );
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
        return NextResponse.json(
            { error: `file too large. max size: 10MB` },
            { status: 400 }
        );
    }

    try {
        // Upload to Vercel Blob
        const path = isSpaceFile ? `spaces/${spaceId}/${file.name}` : `attachments/${session.user.id}/${Date.now()}-${file.name}`;
        const blob = await put(path, file, {
            access: "public",
        });

        // Save metadata to DB ONLY if it's a "Space File"
        // Chat attachments are saved to the Attachment model when the message is sent
        if (isSpaceFile) {
            await prisma.file.create({
                data: {
                    spaceId,
                    userId: session.user.id,
                    name: file.name,
                    size: file.size,
                    mimeType: file.type,
                    storageKey: blob.pathname,
                    url: blob.url,
                },
            });
        }

        return NextResponse.json({ url: blob.url }, { status: 201 });
    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: `upload failed: ${error.message || "check storage configuration"}` },
            { status: 500 }
        );
    }
}
