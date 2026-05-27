import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/utils";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const staticPaths: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date(), priority: 1 },
    { url: `${baseUrl}/login`, lastModified: new Date(), priority: 0.3 },
    { url: `${baseUrl}/register`, lastModified: new Date(), priority: 0.6 },
  ];
  try {
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
      take: 5000,
    });
    const stores = tenants.map((t) => ({
      url: `${baseUrl}/store/${t.slug}`,
      lastModified: t.updatedAt,
      priority: 0.8,
    }));
    return [...staticPaths, ...stores];
  } catch {
    return staticPaths;
  }
}
