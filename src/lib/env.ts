import { z } from "zod";

/**
 * Environment validation. Bila variabel wajib hilang/invalid, app akan
 * fail-fast saat startup di production. Di dev, kita lebih permisif.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi"),
  DATABASE_AUTH_TOKEN: z.string().optional(),

  NEXTAUTH_SECRET: z.string().min(16, "NEXTAUTH_SECRET minimal 16 karakter"),
  NEXTAUTH_URL: z.string().url().optional(),

  // Payment
  PAYMENT_PROVIDER: z.enum(["mock", "midtrans"]).default("mock"),
  MIDTRANS_SERVER_KEY: z.string().optional(),
  MIDTRANS_CLIENT_KEY: z.string().optional(),
  MIDTRANS_IS_PRODUCTION: z
    .string()
    .optional()
    .transform((v) => v === "true"),

  // Notifications
  FONNTE_TOKEN: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_BOT_USERNAME: z.string().optional(),

  // Platform admin allowlist (comma-separated emails)
  PLATFORM_ADMIN_EMAILS: z.string().optional(),

  // Storage
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Observability
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  SENTRY_DSN: z.string().optional(),

  // Rate limit toggle
  RATE_LIMIT_DISABLED: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

export type AppEnv = z.infer<typeof envSchema>;

function loadEnv(): AppEnv {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    if (process.env.NODE_ENV === "production") {
      throw new Error(`❌ Invalid environment variables:\n${issues}`);
    }
    // Di non-prod, log peringatan tapi gunakan fallback aman.
    console.warn(`⚠️  Environment validation warning:\n${issues}\n→ menggunakan default dev.`);
    return envSchema.parse({
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL ?? "file:./dev.db",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "dev-secret-please-change-me-min-16chars",
    });
  }
  return parsed.data;
}

export const env: AppEnv = loadEnv();
