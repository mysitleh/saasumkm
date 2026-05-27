import { prisma } from "@/lib/prisma";

/**
 * Feature gating per paket subscription.
 * Tambahkan fitur baru di tipe `Feature` & matrix `PLAN_FEATURES`.
 */
export const PLAN_FEATURES = {
  BASIC: {
    maxProducts: 50,
    qrisDynamic: false,
    whatsappNotif: false,
    exportCsv: false,
    multiOutlet: false,
    staffManagement: false,
    analyticsAdvanced: false,
  },
  PRO: {
    maxProducts: Number.POSITIVE_INFINITY,
    qrisDynamic: true,
    whatsappNotif: true,
    exportCsv: true,
    multiOutlet: false,
    staffManagement: false,
    analyticsAdvanced: true,
  },
  BUSINESS: {
    maxProducts: Number.POSITIVE_INFINITY,
    qrisDynamic: true,
    whatsappNotif: true,
    exportCsv: true,
    multiOutlet: true,
    staffManagement: true,
    analyticsAdvanced: true,
  },
} as const;

export type Plan = keyof typeof PLAN_FEATURES;
export type Feature = keyof (typeof PLAN_FEATURES)[Plan];

export const PLAN_LABELS: Record<Plan, string> = {
  BASIC: "Basic",
  PRO: "Pro",
  BUSINESS: "Business",
};

export const PLAN_PRICES: Record<Plan, number> = {
  BASIC: 0,
  PRO: 99_000,
  BUSINESS: 299_000,
};

/**
 * Resolve plan aktif sebuah tenant.
 * - Jika belum punya subscription → BASIC.
 * - Jika EXPIRED/CANCELLED → BASIC (downgrade otomatis di sisi UX).
 * - Jika TRIAL/ACTIVE → plan yang tertulis.
 */
export async function getActivePlan(tenantId: string): Promise<Plan> {
  const sub = await prisma.subscription.findUnique({ where: { tenantId } });
  if (!sub) return "BASIC";
  if (sub.status === "EXPIRED" || sub.status === "CANCELLED") return "BASIC";
  if (sub.status === "TRIAL" && sub.trialEndsAt && sub.trialEndsAt < new Date()) return "BASIC";
  return (sub.plan as Plan) ?? "BASIC";
}

export async function hasFeature(tenantId: string, feature: Feature): Promise<boolean> {
  const plan = await getActivePlan(tenantId);
  const value = PLAN_FEATURES[plan][feature];
  return typeof value === "boolean" ? value : Boolean(value);
}

export async function getFeatureLimits(tenantId: string) {
  const plan = await getActivePlan(tenantId);
  return { plan, ...PLAN_FEATURES[plan] };
}

/**
 * Pastikan tenant masih dalam batas paket. Lempar info bila kelebihan.
 */
export async function checkProductLimit(tenantId: string): Promise<{ ok: boolean; current: number; max: number; plan: Plan }> {
  const plan = await getActivePlan(tenantId);
  const max = PLAN_FEATURES[plan].maxProducts;
  if (!Number.isFinite(max)) return { ok: true, current: 0, max: Infinity, plan };
  const current = await prisma.product.count({ where: { tenantId } });
  return { ok: current < max, current, max, plan };
}
