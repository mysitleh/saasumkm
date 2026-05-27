import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Health check sederhana untuk uptime monitoring & load balancer.
 * 200 = sehat, 503 = database tidak tersambung.
 */
export async function GET() {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
      latencyMs: Date.now() - startedAt,
      version: process.env.npm_package_version ?? "0.1.0",
    });
  } catch (e) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: e instanceof Error ? e.message : String(e),
      },
      { status: 503 },
    );
  }
}
