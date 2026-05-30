-- Outlet-aware orders
ALTER TABLE "orders" ADD COLUMN "outletId" TEXT;
CREATE INDEX "orders_outletId_idx" ON "orders"("outletId");

-- Tenant notification preferences
ALTER TABLE "tenants" ADD COLUMN "notifyWhatsapp" INTEGER DEFAULT 1;
ALTER TABLE "tenants" ADD COLUMN "notifyTelegram" INTEGER DEFAULT 0;
ALTER TABLE "tenants" ADD COLUMN "telegramChatId" TEXT;
ALTER TABLE "tenants" ADD COLUMN "dailyDigestEnabled" INTEGER DEFAULT 1;
ALTER TABLE "tenants" ADD COLUMN "dailyDigestHour" INTEGER DEFAULT 21;
ALTER TABLE "tenants" ADD COLUMN "lowStockThreshold" INTEGER DEFAULT 5;

-- Idempotent notification log (prevents double-send of the same digest)
CREATE TABLE "notification_logs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,        -- DAILY_DIGEST | WEEKLY_REPORT | NEW_ORDER | ...
  "channel" TEXT NOT NULL,     -- whatsapp | telegram
  "dedupeKey" TEXT NOT NULL,   -- e.g. "DAILY_DIGEST:2026-05-27"
  "status" TEXT NOT NULL DEFAULT 'SENT',  -- SENT | FAILED | SKIPPED
  "detail" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "notification_logs_tenant_dedupe_channel_key"
  ON "notification_logs"("tenantId", "dedupeKey", "channel");
CREATE INDEX "notification_logs_tenantId_idx" ON "notification_logs"("tenantId");
