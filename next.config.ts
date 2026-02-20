import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  devIndicators: {},
  serverExternalPackages: ["prisma", "@prisma/client", "pg"],
};

export default nextConfig;
