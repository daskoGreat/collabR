import { head } from "@vercel/blob";
import dotenv from "dotenv";
dotenv.config();

async function test() {
    const url = process.argv[2];
    if (!url) {
        console.log("Provide URL");
        return;
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    console.log("Token present:", !!token);

    try {
        console.log("Testing head...");
        const info = await head(url, { token });
        console.log("Head success:", info);

        console.log("Testing fetch with Bearer token...");
        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log("Fetch status:", res.status);
        if (!res.ok) {
            console.log("Fetch error:", await res.text());
        } else {
            console.log("Fetch success! Content-Type:", res.headers.get("content-type"));
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

test();
