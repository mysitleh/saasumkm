import type { ParsedWebhook, PaymentCreateResult, PaymentOrderInput, PaymentProvider } from "./types";

/**
 * Mock provider untuk development & testing.
 *
 * - Membuat "QRIS dinamis" palsu via QR code service publik (api.qrserver.com).
 * - Webhook signature dianggap valid bila == 'mock-signature'.
 * - Parse webhook menerima format: { eventId, orderNumber, amount, status, providerRef }.
 *
 * Ini cukup untuk demo flow QRIS dinamis tanpa akun gateway production.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  async createQrisPayment(input: PaymentOrderInput): Promise<PaymentCreateResult> {
    const providerRef = `MOCK-${input.orderNumber}-${Date.now()}`;
    const payload = `umkmstore://pay?ref=${providerRef}&amount=${input.amount}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payload)}`;
    const expiresAt = new Date(Date.now() + 30 * 60_000);
    return { providerRef, qrCodeUrl, qrPayload: payload, expiresAt, raw: { provider: "mock", input } };
  }

  verifySignature(_payload: unknown, signature: string | null): boolean {
    return signature === "mock-signature";
  }

  parseWebhook(payload: unknown): ParsedWebhook {
    const p = payload as {
      eventId?: string;
      orderNumber?: string;
      amount?: number;
      status?: ParsedWebhook["status"];
      providerRef?: string;
    };
    if (!p?.eventId || !p?.orderNumber || !p?.providerRef || typeof p.amount !== "number" || !p.status) {
      throw new Error("Invalid mock webhook payload");
    }
    return {
      rawEventId: p.eventId,
      orderNumber: p.orderNumber,
      amount: p.amount,
      status: p.status,
      providerRef: p.providerRef,
    };
  }
}
