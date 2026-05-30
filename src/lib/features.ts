import { prisma } from "@/lib/prisma";

/**
 * Feature gating per paket subscription.
 *
 * Prinsip: paket BUSINESS (termahal) membuka SEMUA fitur tanpa batas.
 * Saat menambah fitur baru, cukup tambahkan ke `BOOLEAN_FEATURES` dan
 * BUSINESS otomatis `true` lewat `allTrue()`. Tidak perlu edit manual.
 *
 * Per-tenant `featureOverrides` (JSON) memungkinkan platform admin
 * memberi "layanan full" / enterprise deal di luar paket standar.
 */

// Semua boolean feature flags dalam satu sumber kebenaran.
const BOOLEAN_FEATURES = [
  "qrisDynamic",
  "whatsappNotif",
  "telegramNotif",
  "dailyDigest",
  "exportCsv",
  "multiOutlet",
  "staffManagement",
  "analyticsAdvanced",
  "themeBuilder",
  "templateBuilder",
  "customDomain",
  "prioritySupport",
  "apiAccess",
  "aiAssistant",
] as const;

export type BooleanFeature = (typeof BOOLEAN_FEATURES)[number];

function allFalse(): Record<BooleanFeature, boolean> {
  return Object.fromEntries(BOOLEAN_FEATURES.map((f) => [f, false])) as Record<BooleanFeature, boolean>;
}
function allTrue(): Record<BooleanFeature, boolean> {
  return Object.fromEntries(BOOLEAN_FEATURES.map((f) => [f, true])) as Record<BooleanFeature, boolean>;
}

interface PlanCaps extends Record<BooleanFeature, boolean> {
  maxProducts: number;
  maxOutlets: number;
  maxStaff: number;
}

export const PLAN_FEATURES: Record<"BASIC" | "PRO" | "BUSINESS", PlanCaps> = {
  BASIC: {
    ...allFalse(),
    // Theme builder & basic branding tetap dibuka agar storefront tidak generik.
    themeBuilder: true,
    maxProducts: 50,
    maxOutlets: 1,
    maxStaff: 0,
  },
  PRO: {
    ...allFalse(),
    qrisDynamic: true,
    whatsappNotif: true,
    telegramNotif: true,
    dailyDigest: true,
    exportCsv: true,
    analyticsAdvanced: true,
    themeBuilder: true,
    templateBuilder: true,
    aiAssistant: true,
    maxProducts: Number.POSITIVE_INFINITY,
    maxOutlets: 1,
    maxStaff: 0,
  },
  BUSINESS: {
    // BUSINESS = full layanan. Semua boolean true + semua limit unlimited.
    ...allTrue(),
    maxProducts: Number.POSITIVE_INFINITY,
    maxOutlets: Number.POSITIVE_INFINITY,
    maxStaff: Number.POSITIVE_INFINITY,
  },
};

export type Plan = keyof typeof PLAN_FEATURES;
export type Feature = keyof PlanCaps;

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

export const PLAN_ORDER: Plan[] = ["BASIC", "PRO", "BUSINESS"];

/** Resolve plan aktif sebuah tenant. */
export async function getActivePlan(tenantId: string): Promise<Plan> {
  const sub = await prisma.subscription.findUnique({ where: { tenantId } });
  if (!sub) return "BASIC";
  if (sub.status === "EXPIRED" || sub.status === "CANCELLED") return "BASIC";
  if (sub.status === "TRIAL" && sub.trialEndsAt && sub.trialEndsAt < new Date()) return "BASIC";
  return (sub.plan as Plan) ?? "BASIC";
}

/** Parse per-tenant featureOverrides JSON safely. */
function parseOverrides(raw: string | null | undefined): Partial<Record<BooleanFeature, boolean>> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Cek satu boolean feature untuk tenant.
 * Urutan prioritas: featureOverrides (admin grant) > plan default.
 */
export async function hasFeature(tenantId: string, feature: Feature): Promise<boolean> {
  const [plan, tenant] = await Promise.all([
    getActivePlan(tenantId),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { featureOverrides: true } }),
  ]);
  // Numeric caps → treat as enabled if > 0 / infinite.
  const planValue = PLAN_FEATURES[plan][feature];
  if (typeof planValue === "number") return planValue > 0;

  const overrides = parseOverrides(tenant?.featureOverrides);
  if (feature in overrides && typeof overrides[feature as BooleanFeature] === "boolean") {
    return overrides[feature as BooleanFeature]!;
  }
  return planValue;
}

export async function getFeatureLimits(tenantId: string) {
  const [plan, tenant] = await Promise.all([
    getActivePlan(tenantId),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { featureOverrides: true } }),
  ]);
  const overrides = parseOverrides(tenant?.featureOverrides);
  return { plan, ...PLAN_FEATURES[plan], ...overrides };
}

export async function checkProductLimit(
  tenantId: string,
): Promise<{ ok: boolean; current: number; max: number; plan: Plan }> {
  const plan = await getActivePlan(tenantId);
  const max = PLAN_FEATURES[plan].maxProducts;
  if (!Number.isFinite(max)) return { ok: true, current: 0, max: Infinity, plan };
  const current = await prisma.product.count({ where: { tenantId } });
  return { ok: current < max, current, max, plan };
}

/** Human-readable feature labels for the billing + admin GUIs. */
export const FEATURE_LABELS: Record<BooleanFeature, string> = {
  qrisDynamic: "QRIS Dinamis (auto-konfirmasi)",
  whatsappNotif: "Notifikasi WhatsApp",
  telegramNotif: "Notifikasi Telegram",
  dailyDigest: "Laporan Harian Otomatis",
  exportCsv: "Export CSV",
  multiOutlet: "Multi Outlet",
  staffManagement: "Staff Management",
  analyticsAdvanced: "Business Intelligence",
  themeBuilder: "Theme Builder",
  templateBuilder: "Template Builder",
  customDomain: "Custom Domain",
  prioritySupport: "Priority Support",
  apiAccess: "API Access",
  aiAssistant: "AI Assistant 360",
};

export const BOOLEAN_FEATURE_LIST = BOOLEAN_FEATURES;
