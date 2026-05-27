import { prisma } from "@/lib/prisma";

/**
 * Loyalty system: 1 poin per Rp 10.000 belanja.
 * Configurable per tenant di masa depan.
 */
const POINTS_PER_10K = 1;
const REDEEM_RATE = 100; // 100 poin = Rp 10.000 diskon

/**
 * Hitung poin yang didapat dari sebuah order.
 */
export function calculatePoints(orderTotal: number): number {
  return Math.floor(orderTotal / 10_000) * POINTS_PER_10K;
}

/**
 * Hitung nilai diskon dari poin yang di-redeem.
 */
export function pointsToDiscount(points: number): number {
  return Math.floor(points / REDEEM_RATE) * 10_000;
}

/**
 * Tambah poin ke loyalty card customer setelah order paid.
 * Buat card baru jika belum ada.
 */
export async function earnPoints(tenantId: string, customerPhone: string, customerName: string, orderTotal: number, orderNumber: string) {
  if (!customerPhone) return null;
  const points = calculatePoints(orderTotal);
  if (points <= 0) return null;

  const card = await prisma.loyaltyCard.upsert({
    where: { tenantId_customerPhone: { tenantId, customerPhone } },
    create: {
      tenantId,
      customerPhone,
      customerName,
      points,
      totalSpent: orderTotal,
      totalOrders: 1,
    },
    update: {
      customerName,
      points: { increment: points },
      totalSpent: { increment: orderTotal },
      totalOrders: { increment: 1 },
    },
  });

  await prisma.loyaltyPointLog.create({
    data: {
      cardId: card.id,
      type: "EARN",
      points,
      reason: `Order ${orderNumber}`,
    },
  });

  return { cardId: card.id, pointsEarned: points, totalPoints: card.points + points };
}

/**
 * Redeem poin dari loyalty card.
 */
export async function redeemPoints(tenantId: string, customerPhone: string, pointsToRedeem: number, reason: string) {
  const card = await prisma.loyaltyCard.findUnique({
    where: { tenantId_customerPhone: { tenantId, customerPhone } },
  });
  if (!card || card.points < pointsToRedeem) return null;

  await prisma.loyaltyCard.update({
    where: { id: card.id },
    data: { points: { decrement: pointsToRedeem } },
  });

  await prisma.loyaltyPointLog.create({
    data: {
      cardId: card.id,
      type: "REDEEM",
      points: -pointsToRedeem,
      reason,
    },
  });

  return { discount: pointsToDiscount(pointsToRedeem), remainingPoints: card.points - pointsToRedeem };
}

/**
 * Get loyalty card info untuk customer.
 */
export async function getCustomerLoyalty(tenantId: string, customerPhone: string) {
  return prisma.loyaltyCard.findUnique({
    where: { tenantId_customerPhone: { tenantId, customerPhone } },
    include: { pointLogs: { orderBy: { createdAt: "desc" }, take: 10 } },
  });
}
