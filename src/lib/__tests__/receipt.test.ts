import { describe, it, expect } from "vitest";
import { formatReceipt, formatReceiptWhatsApp } from "@/lib/receipt";
import type { ReceiptOrder, ReceiptTenant } from "@/lib/receipt";

const tenant: ReceiptTenant = {
  name: "Warung Bu Sri",
  slug: "warung-bu-sri",
  phone: "081234567890",
  address: "Jl. Merdeka No. 10",
};

const baseOrder: ReceiptOrder = {
  orderNumber: "ORD-20260607-1234",
  customerName: "Budi Santoso",
  customerPhone: "089988776655",
  deliveryType: "PICKUP",
  deliveryAddress: null,
  status: "PAID_MANUAL",
  createdAt: new Date("2026-06-07T10:30:00Z"),
  items: [
    { name: "Nasi Goreng", price: 25_000, quantity: 2, subtotal: 50_000 },
    { name: "Es Teh", price: 5_000, quantity: 2, subtotal: 10_000 },
  ],
  subtotal: 60_000,
  discountAmount: 0,
  total: 60_000,
  paymentMethod: "QRIS_STATIC",
};

describe("formatReceipt", () => {
  it("includes tenant name (uppercased) and contact", () => {
    const r = formatReceipt(tenant, baseOrder);
    expect(r).toContain("WARUNG BU SRI");
    expect(r).toContain("Jl. Merdeka No. 10");
    expect(r).toContain("Tel: 081234567890");
  });

  it("includes order number, customer, and status label", () => {
    const r = formatReceipt(tenant, baseOrder);
    expect(r).toContain("ORD-20260607-1234");
    expect(r).toContain("Budi Santoso");
    expect(r).toContain("Sudah Dibayar"); // PAID_MANUAL label
  });

  it("lists all items with quantity and subtotal", () => {
    const r = formatReceipt(tenant, baseOrder);
    expect(r).toContain("Nasi Goreng");
    expect(r).toContain("Es Teh");
    expect(r).toContain("2x");
  });

  it("shows TOTAL and formatted rupiah", () => {
    const r = formatReceipt(tenant, baseOrder);
    expect(r).toContain("TOTAL");
    // formatRupiah uses non-breaking space; normalize before matching
    expect(r.replace(/\u00a0/g, " ")).toMatch(/Rp\s?60\.000/);
  });

  it("omits discount line when discount is zero", () => {
    const r = formatReceipt(tenant, baseOrder);
    expect(r).not.toContain("Diskon");
  });

  it("shows discount line when discount applied", () => {
    const r = formatReceipt(tenant, { ...baseOrder, discountAmount: 10_000, total: 50_000 });
    expect(r).toContain("Diskon");
    expect(r.replace(/\u00a0/g, " ")).toMatch(/-Rp\s?10\.000/);
  });

  it("shows pickup line for PICKUP orders", () => {
    const r = formatReceipt(tenant, baseOrder);
    expect(r).toContain("Ambil di tempat");
  });

  it("shows delivery address for DELIVERY orders", () => {
    const r = formatReceipt(tenant, {
      ...baseOrder,
      deliveryType: "DELIVERY",
      deliveryAddress: "Jl. Mawar No. 5",
    });
    expect(r).toContain("Kirim ke: Jl. Mawar No. 5");
  });

  it("includes storefront link in footer", () => {
    const r = formatReceipt(tenant, baseOrder);
    expect(r).toContain("warung-bu-sri.umkmstore.id");
  });

  it("handles tenant without optional address/phone", () => {
    const minimal: ReceiptTenant = { name: "Toko X", slug: "toko-x" };
    const r = formatReceipt(minimal, baseOrder);
    expect(r).toContain("TOKO X");
    expect(r).not.toContain("Tel:");
  });
});

describe("formatReceiptWhatsApp", () => {
  it("wraps receipt in monospace code block", () => {
    const r = formatReceiptWhatsApp(tenant, baseOrder);
    expect(r.startsWith("```\n")).toBe(true);
    expect(r.endsWith("\n```")).toBe(true);
    expect(r).toContain("WARUNG BU SRI");
  });
});
