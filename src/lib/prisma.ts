import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
  // Convert file:./xxx to file:xxx for libsql
  const libsqlUrl = dbUrl.startsWith("file:./") ? `file:${dbUrl.slice(7)}` : dbUrl.startsWith("file:") ? dbUrl : `file:${dbUrl}`;
  const adapter = new PrismaLibSql({ url: libsqlUrl });
  return new PrismaClient({ adapter } as any);
}

const g = globalThis as any;
export const prisma: PrismaClient = g.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
