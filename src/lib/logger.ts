import { env } from "@/lib/env";

type LogLevel = "debug" | "info" | "warn" | "error";
const LEVEL_RANK: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function shouldLog(level: LogLevel): boolean {
  return LEVEL_RANK[level] >= LEVEL_RANK[env.LOG_LEVEL];
}

function fmt(level: LogLevel, msg: string, meta?: Record<string, unknown>): string {
  const base = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...(meta ?? {}),
  };
  return JSON.stringify(base);
}

/**
 * Structured JSON logger ringan tanpa dependency tambahan.
 * Cocok untuk Vercel/serverless (stdout langsung jadi log).
 */
export const logger = {
  debug(msg: string, meta?: Record<string, unknown>) {
    if (shouldLog("debug")) console.log(fmt("debug", msg, meta));
  },
  info(msg: string, meta?: Record<string, unknown>) {
    if (shouldLog("info")) console.log(fmt("info", msg, meta));
  },
  warn(msg: string, meta?: Record<string, unknown>) {
    if (shouldLog("warn")) console.warn(fmt("warn", msg, meta));
  },
  error(msg: string, meta?: Record<string, unknown>) {
    if (shouldLog("error")) console.error(fmt("error", msg, meta));
  },
};
