import { env } from "@/lib/env";
import { MidtransProvider } from "./midtrans-provider";
import { MockPaymentProvider } from "./mock-provider";
import type { PaymentProvider } from "./types";

export type { PaymentProvider, PaymentOrderInput, PaymentCreateResult, ParsedWebhook } from "./types";

let cached: PaymentProvider | null = null;

/**
 * Resolve payment provider berdasarkan ENV.
 * Default: mock (untuk dev). Set PAYMENT_PROVIDER=midtrans di prod.
 */
export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached;
  switch (env.PAYMENT_PROVIDER) {
    case "midtrans":
      cached = new MidtransProvider();
      break;
    case "mock":
    default:
      cached = new MockPaymentProvider();
  }
  return cached;
}

// Hanya untuk testing — supaya bisa di-reset.
export function __resetPaymentProvider() {
  cached = null;
}
