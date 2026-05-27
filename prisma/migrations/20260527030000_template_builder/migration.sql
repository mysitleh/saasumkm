-- Storefront Template Builder
ALTER TABLE "tenants" ADD COLUMN "layoutTemplate" TEXT DEFAULT 'classic';
ALTER TABLE "tenants" ADD COLUMN "buttonStyle" TEXT DEFAULT 'pill';
ALTER TABLE "tenants" ADD COLUMN "iconStyle" TEXT DEFAULT 'regular';
ALTER TABLE "tenants" ADD COLUMN "categoryStyle" TEXT DEFAULT 'chips';
ALTER TABLE "tenants" ADD COLUMN "heroEnabled" INTEGER DEFAULT 1;
ALTER TABLE "tenants" ADD COLUMN "heroImageUrl" TEXT;
ALTER TABLE "tenants" ADD COLUMN "heroHeadline" TEXT;
ALTER TABLE "tenants" ADD COLUMN "heroSubheadline" TEXT;
ALTER TABLE "tenants" ADD COLUMN "heroCtaLabel" TEXT;
ALTER TABLE "tenants" ADD COLUMN "carouselEnabled" INTEGER DEFAULT 0;
ALTER TABLE "tenants" ADD COLUMN "carouselProductIds" TEXT;
