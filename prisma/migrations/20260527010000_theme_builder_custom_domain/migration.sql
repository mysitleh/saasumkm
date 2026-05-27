-- ThemeBuilder + CustomDomain support on Tenant.
ALTER TABLE "tenants" ADD COLUMN "themeMode" TEXT DEFAULT 'light';
ALTER TABLE "tenants" ADD COLUMN "themePrimary" TEXT;
ALTER TABLE "tenants" ADD COLUMN "themeAccent" TEXT;
ALTER TABLE "tenants" ADD COLUMN "themeSurface" TEXT;
ALTER TABLE "tenants" ADD COLUMN "themeInk" TEXT;
ALTER TABLE "tenants" ADD COLUMN "themeRadius" INTEGER DEFAULT 12;
ALTER TABLE "tenants" ADD COLUMN "themeFont" TEXT DEFAULT 'Inter';

ALTER TABLE "tenants" ADD COLUMN "customDomain" TEXT;
ALTER TABLE "tenants" ADD COLUMN "customDomainStatus" TEXT DEFAULT 'NONE';
ALTER TABLE "tenants" ADD COLUMN "customDomainVerifyToken" TEXT;
ALTER TABLE "tenants" ADD COLUMN "customDomainVerifiedAt" DATETIME;

CREATE UNIQUE INDEX "tenants_customDomain_key" ON "tenants"("customDomain");
