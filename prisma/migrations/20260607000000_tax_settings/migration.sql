-- AlterTable: add tax/PPN settings columns to tenants
ALTER TABLE "tenants" ADD COLUMN "taxEnabled" BOOLEAN DEFAULT false;
ALTER TABLE "tenants" ADD COLUMN "taxRate" REAL DEFAULT 0.11;
ALTER TABLE "tenants" ADD COLUMN "taxMode" TEXT DEFAULT 'EXCLUSIVE';
