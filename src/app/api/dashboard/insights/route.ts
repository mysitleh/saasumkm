import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { withErrorHandler, unauthorized, forbidden } from "@/lib/api-handler";
import { hasFeature } from "@/lib/features";
import { loadInsightsBundle } from "@/lib/bi";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/insights — full Business Intelligence bundle.
 *
 * Returns RFM segmentation, CLV, cohort retention, sales forecast (Holt),
 * inventory velocity, churn risk, market-basket affinity, hour×weekday
 * heatmap, and promo ROI.
 *
 * Gated: paket Pro+ (analyticsAdvanced).
 */
export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  if (!(await hasFeature(session.user.tenantId, "analyticsAdvanced"))) {
    throw forbidden("Business Intelligence hanya tersedia di paket Pro ke atas.");
  }
  const bundle = await loadInsightsBundle(session.user.tenantId);
  return NextResponse.json(bundle);
});
