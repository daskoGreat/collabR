import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { head } from "@vercel/blob";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) {
        return new NextResponse("URL required", { status: 400 });
    }

    // Security: Only allow Vercel Blob URLs
    if (!url.includes("public.blob.vercel-storage.com")) {
        return new NextResponse("Invalid URL", { status: 400 });
    }

    try {
        // Fetch the file from Vercel Blob
        // We use fetch with the same token used for put/head
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
            },
        });

        if (!response.ok) {
            return new NextResponse("Failed to fetch blob", { status: response.status });
        }

        // Forward the response with correct headers
        const blob = await response.blob();
        const headers = new Headers();
        headers.set("Content-Type", response.headers.get("Content-Type") || "application/octet-stream");
        headers.set("Content-Length", response.headers.get("Content-Length") || "");

        // Optional: Cache for 1 hour
        headers.set("Cache-Control", "public, max-age=3600");

        return new NextResponse(blob, {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error("Proxy error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
