import { prisma } from "@/lib/prisma";
import type { Plan } from "@/lib/features";

const TRIAL_DAYS = 14;
const PERIOD_DAYS = 30;

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Buat subscription trial 14 hari untuk tenant baru.
 * Idempotent — jika sudah ada subscription, return yang lama.
 */
export async function ensureTrialSubscription(tenantId: string) {
  const existing = await prisma.subscription.findUnique({ where: { tenantId } });
  if (existing) return existing;
  const now = new Date();
  return prisma.subscription.create({
    data: {
      tenantId,
      plan: "PRO",
      status: "TRIAL",
      trialEndsAt: addDays(now, TRIAL_DAYS),
      currentPeriodStart: now,
      currentPeriodEnd: addDays(now, TRIAL_DAYS),
    },
  });
}

export async function activatePlan(tenantId: string, plan: Plan) {
  const now = new Date();
  return prisma.subscription.upsert({
    where: { tenantId },
    update: {
      plan,
      status: "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: addDays(now, PERIOD_DAYS),
      cancelledAt: null,
    },
    create: {
      tenantId,
      plan,
      status: "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: addDays(now, PERIOD_DAYS),
    },
  });
}

export async function cancelSubscription(tenantId: string) {
  return prisma.subscription.update({
    where: { tenantId },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });
}

/**
 * Cron-style: pindahkan subscription yang sudah lewat masa berlaku ke EXPIRED.
 * Aman dipanggil berulang.
 */
export async function expireOverdueSubscriptions(now: Date = new Date()) {
  const result = await prisma.subscription.updateMany({
    where: {
      status: { in: ["TRIAL", "ACTIVE"] },
      currentPeriodEnd: { lt: now },
    },
    data: { status: "EXPIRED" },
  });
  return result.count;
}
