import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { logger } from "@/lib/logger";

export class AppError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

export function badRequest(message: string, code?: string) {
  return new AppError(400, message, code);
}
export function unauthorized(message = "Unauthorized") {
  return new AppError(401, message);
}
export function forbidden(message = "Forbidden") {
  return new AppError(403, message);
}
export function notFound(message = "Tidak ditemukan") {
  return new AppError(404, message);
}
export function conflict(message: string) {
  return new AppError(409, message);
}
export function tooMany(message = "Terlalu banyak permintaan, coba lagi nanti.") {
  return new AppError(429, message);
}

type Handler<C = unknown> = (req: Request, ctx: C) => Promise<Response> | Response;

/**
 * Wrap API route handler dengan error handler terpusat.
 * - ZodError → 400
 * - Prisma unique violation → 409
 * - Prisma not found → 404
 * - AppError → status sesuai
 * - Lainnya → 500 (dilog)
 */
export function withErrorHandler<C = unknown>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
      }
      if (error instanceof ZodError) {
        return NextResponse.json({ error: error.issues[0]?.message ?? "Input tidak valid." }, { status: 400 });
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return NextResponse.json({ error: "Data sudah ada (duplicate)." }, { status: 409 });
        }
        if (error.code === "P2025") {
          return NextResponse.json({ error: "Data tidak ditemukan." }, { status: 404 });
        }
      }
      logger.error("Unhandled API error", {
        error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
        url: req.url,
        method: req.method,
      });
      return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
    }
  };
}
