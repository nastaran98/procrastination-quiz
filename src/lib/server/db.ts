import { PrismaClient } from "@prisma/client";
import { databaseUrls } from "@/lib/server/database-config";
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export function getDb(): PrismaClient | null {
  const urls = databaseUrls(process.env);
  if (!urls) return null;
  if (!globalForPrisma.prisma) globalForPrisma.prisma = new PrismaClient({ datasourceUrl: urls.runtime, log: ["error"] });
  return globalForPrisma.prisma;
}
