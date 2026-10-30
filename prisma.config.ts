import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";
import { databaseUrls } from "./src/lib/server/database-config";

// Use the same .env.local / .env loading order as Next.js.
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
const urls = databaseUrls(process.env);
if (urls) {
  // Prisma 6 validates schema env references before applying datasource overrides.
  process.env.DATABASE_URL = urls.runtime;
  process.env.DIRECT_URL = urls.direct;
}

const baseConfig = {
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
};

export default urls
  ? defineConfig({ ...baseConfig, engine: "classic", datasource: { url: urls.runtime, directUrl: urls.direct } })
  : defineConfig(baseConfig);
