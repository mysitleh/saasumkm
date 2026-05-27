import { describe, it, expect } from "vitest";
import { MockPaymentProvider } from "@/lib/payment/mock-provider";

describe("MockPaymentProvider", () => {
  const provider = new MockPaymentProvider();

  it("creates QRIS payment with required fields", async () => {
    const r = await provider.createQrisPayment({
      orderId: "o1",
      orderNumber: "ORD-20260101-0001",
      amount: 25000,
      customerName: "Test",
    });
    expect(r.providerRef).toContain("ORD-20260101-0001");
    expect(r.qrCodeUrl).toContain("api.qrserver.com");
  });

  it("verifies signature", () => {
    expect(provider.verifySignature({}, "mock-signature")).toBe(true);
    expect(provider.verifySignature({}, "wrong")).toBe(false);
  });

  it("parses webhook", () => {
    const parsed = provider.parseWebhook({
      eventId: "e1",
      orderNumber: "ORD-1",
      amount: 1000,
      status: "PAID",
      providerRef: "REF-1",
    });
    expect(parsed.orderNumber).toBe("ORD-1");
    expect(parsed.status).toBe("PAID");
  });

  it("rejects malformed webhook", () => {
    expect(() => provider.parseWebhook({})).toThrow();
  });
});
