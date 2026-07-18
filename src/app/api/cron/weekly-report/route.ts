import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsApp } from "@/lib/notifications";
import { formatRupiah } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { withErrorHandler } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

/**
 * Cron: Kirim laporan mingguan via WhatsApp ke semua tenant aktif yang punya
 * fitur whatsappNotif dan nomor HP.
 *
 * Jadwalkan: setiap Senin jam 8 pagi (0 8 * * 1)
 */
export const GET = withErrorHandler(async (req: Request) => {
  const cronSecret = process.env.CRON_SECRET;
  if (process.env.NODE_ENV === "production" && !cronSecret) {
    logger.error("Cron: CRON_SECRET is missing");
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  startOfWeek.setHours(0, 0, 0, 0);

  // Get all active tenants with phone
  const tenants = await prisma.tenant.findMany({
    where: { isActive: true, phone: { not: null } },
    select: { id: true, name: true, phone: true, slug: true },
  });

  let sent = 0;
  for (const tenant of tenants) {
    if (!tenant.phone) continue;

    // Check subscription has WA feature
    const sub = await prisma.subscription.findUnique({ where: { tenantId: tenant.id } });
    if (!sub || !["ACTIVE", "TRIAL"].includes(sub.status) || sub.plan === "BASIC") continue;

    // Get weekly stats
    const [revenue, orderCount] = await Promise.all([
      prisma.order.aggregate({
        where: { tenantId: tenant.id, status: { in: ["PAID_MANUAL", "PROCESSING", "COMPLETED"] }, createdAt: { gte: startOfWeek } },
        _sum: { total: true },
      }),
      prisma.order.count({
        where: { tenantId: tenant.id, status: { in: ["PAID_MANUAL", "PROCESSING", "COMPLETED"] }, createdAt: { gte: startOfWeek } },
      }),
    ]);

    const weeklyRevenue = revenue._sum.total ?? 0;
    if (orderCount === 0) continue; // Skip if no orders

    const message = [
      `📊 *Laporan Mingguan — ${tenant.name}*`,
      ``,
      `💰 Omzet: ${formatRupiah(weeklyRevenue)}`,
      `📦 Order: ${orderCount}`,
      `📈 Rata-rata: ${formatRupiah(Math.round(weeklyRevenue / orderCount))}/order`,
      ``,
      `Terus semangat! 🚀`,
    ].join("\n");

    const result = await sendWhatsApp(tenant.phone, message);
    if (result.ok) sent++;
  }

  logger.info("Weekly report cron completed", { sent, totalTenants: tenants.length });
  return NextResponse.json({ success: true, sent, totalTenants: tenants.length });
});
