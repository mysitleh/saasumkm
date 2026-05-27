import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, unauthorized, forbidden } from "@/lib/api-handler";
import { hasFeature } from "@/lib/features";
import { ORDER_STATUS_LABELS } from "@/lib/utils";

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export const GET = withErrorHandler(async (req: Request) => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  if (!(await hasFeature(session.user.tenantId, "exportCsv"))) {
    throw forbidden("Export CSV hanya tersedia di paket Pro ke atas.");
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const where: Record<string, unknown> = { tenantId: session.user.tenantId };
  if (status) where.status = status;
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const orders = await prisma.order.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const headers = [
    "OrderNumber",
    "TanggalISO",
    "Customer",
    "Phone",
    "DeliveryType",
    "Subtotal",
    "Discount",
    "Total",
    "Status",
    "PaymentMethod",
    "Items",
  ];
  const rows = orders.map((o) =>
    [
      o.orderNumber,
      o.createdAt.toISOString(),
      o.customerName,
      o.customerPhone ?? "",
      o.deliveryType,
      o.subtotal,
      o.discountAmount,
      o.total,
      ORDER_STATUS_LABELS[o.status] ?? o.status,
      o.paymentMethod,
      o.items.map((i) => `${i.name} x${i.quantity}`).join("; "),
    ]
      .map(csvEscape)
      .join(","),
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const filename = `orders-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
