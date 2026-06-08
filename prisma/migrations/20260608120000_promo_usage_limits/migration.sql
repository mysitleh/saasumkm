-- Promo usage limits: global (usageLimit) and per-customer (perCustomerLimit).
-- Both nullable: NULL = unlimited (existing behavior preserved).
ALTER TABLE "promos" ADD COLUMN "usageLimit" INTEGER;
ALTER TABLE "promos" ADD COLUMN "perCustomerLimit" INTEGER;
