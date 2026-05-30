-- Logo Builder: flexible per-tenant logo configuration (JSON)
ALTER TABLE "tenants" ADD COLUMN "logoConfig" TEXT;
