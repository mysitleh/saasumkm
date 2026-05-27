import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { env } from "@/lib/env";

function createPrismaClient(): PrismaClient {
  const dbUrl = env.DATABASE_URL;
  // libsql expects "file:dev.db" not "file:./dev.db".
  const libsqlUrl = dbUrl.startsWith("file:./")
    ? `file:${dbUrl.slice(7)}`
    : dbUrl.startsWith("file:")
      ? dbUrl
      : dbUrl;
  const adapter = new PrismaLibSql({
    url: libsqlUrl,
    authToken: env.DATABASE_AUTH_TOKEN,
  });
  return new PrismaClient({
    adapter: adapter as unknown as never,
    log: env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

declare global {
  var __prismaClient: PrismaClient | undefined;
}

export const prisma: PrismaClient = globalThis.__prismaClient ?? createPrismaClient();
if (env.NODE_ENV !== "production") globalThis.__prismaClient = prisma;
