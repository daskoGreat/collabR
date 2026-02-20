import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function getDirectDatabaseUrl(): string {
  const rawUrl = process.env.DATABASE_URL;

  if (!rawUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Standard postgres:// URL — use directly
  if (rawUrl.startsWith("postgres://") || rawUrl.startsWith("postgresql://")) {
    return rawUrl;
  }

  // prisma+postgres:// URL (PPG local dev) — extract direct URL from API key
  if (rawUrl.startsWith("prisma+postgres://") || rawUrl.startsWith("prisma://")) {
    try {
      const normalized = rawUrl.replace(/^prisma\+postgres:\/\//, "https://").replace(/^prisma:\/\//, "https://");
      const parsed = new URL(normalized);
      const apiKey = parsed.searchParams.get("api_key");
      if (apiKey) {
        const decoded = JSON.parse(Buffer.from(apiKey, "base64").toString());
        if (decoded.databaseUrl) {
          return decoded.databaseUrl;
        }
      }
    } catch {
      // Fall through
    }
  }

  throw new Error(`Cannot determine database URL from DATABASE_URL: ${rawUrl.substring(0, 30)}...`);
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

function createPrismaClient() {
  const isDev = process.env.NODE_ENV === "development";

  // In development, we use the standard Prisma engine with the direct URL 
  // to avoid the connection stability issues seen with the pg-adapter and the local proxy.
  if (isDev) {
    const connectionString = getDirectDatabaseUrl();
    if (!globalForPrisma.pgPool) {
      globalForPrisma.pgPool = new Pool({ connectionString });
    }
    const adapter = new PrismaPg(globalForPrisma.pgPool);
    console.log("[db] Using PrismaPg adapter in dev for stability.");
    return new PrismaClient({ adapter, log: ["error", "warn"] });
  }

  // In production (or non-dev), we use the pg-adapter which is required for 
  // certain serverless/edge environments.
  const connectionString = getDirectDatabaseUrl();
  if (!globalForPrisma.pgPool) {
    globalForPrisma.pgPool = new Pool({ connectionString });
  }

  const adapter = new PrismaPg(globalForPrisma.pgPool);
  return new PrismaClient({ adapter, log: ["error", "warn"] });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
