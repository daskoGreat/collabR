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
        console.log(`[Proxy] Fetching blob: ${url}`);
        const token = process.env.BLOB_READ_WRITE_TOKEN;
        if (!token) {
            console.error("[Proxy] BLOB_READ_WRITE_TOKEN is missing");
            return new NextResponse("Server configuration error", { status: 500 });
        }

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Proxy] Failed to fetch blob: ${response.status} ${response.statusText}`, errorText);
            return new NextResponse(`Failed to fetch blob: ${response.statusText}`, { status: response.status });
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
