import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "collab-bot/1.0",
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) throw new Error("Fetch failed");

        const html = await response.text();

        // Very basic meta tag extraction
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : "";

        const descMatch = html.match(/<meta name="description" content="(.*?)"/i) ||
            html.match(/<meta property="og:description" content="(.*?)"/i);
        const description = descMatch ? descMatch[1] : "";

        const imageMatch = html.match(/<meta property="og:image" content="(.*?)"/i) ||
            html.match(/<meta name="twitter:image" content="(.*?)"/i);
        const image = imageMatch ? imageMatch[1] : "";

        const domain = new URL(url).hostname;

        return NextResponse.json({
            title: title.slice(0, 100),
            description: description.slice(0, 200),
            image,
            domain,
            url
        });
    } catch (error) {
        console.error("Link preview error:", error);
        return NextResponse.json({ error: "failed to fetch preview" }, { status: 500 });
    }
}
