/**
 * Kontrak universal untuk payment provider (mock, midtrans, xendit, dll).
 * Implementasi cukup memenuhi interface ini agar bisa di-swap tanpa
 * mengubah business logic order.
 */
export interface PaymentOrderInput {
  orderId: string;
  orderNumber: string;
  amount: number;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
}

export interface PaymentCreateResult {
  providerRef: string;
  qrCodeUrl?: string;
  qrPayload?: string;
  expiresAt?: Date;
  raw: unknown;
}

export interface ParsedWebhook {
  providerRef: string;
  orderNumber: string;
  amount: number;
  status: "PAID" | "PENDING" | "FAILED" | "EXPIRED";
  rawEventId: string;
}

export interface PaymentProvider {
  readonly name: string;
  createQrisPayment(input: PaymentOrderInput): Promise<PaymentCreateResult>;
  verifySignature(payload: unknown, signature: string | null): boolean;
  parseWebhook(payload: unknown): ParsedWebhook;
}
