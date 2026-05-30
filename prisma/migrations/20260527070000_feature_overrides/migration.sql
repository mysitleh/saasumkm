-- Per-tenant feature overrides (admin "full service" grants) + platform flag
ALTER TABLE "tenants" ADD COLUMN "featureOverrides" TEXT;
ALTER TABLE "tenants" ADD COLUMN "isPlatformAdmin" INTEGER DEFAULT 0;
