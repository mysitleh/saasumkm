import crypto from "node:crypto";
import { env } from "@/lib/env";
import type { ParsedWebhook, PaymentCreateResult, PaymentOrderInput, PaymentProvider } from "./types";

/**
 * Midtrans Snap / Core API provider (tanpa SDK eksternal supaya bundle ringan).
 * Hanya melakukan HTTPS calls ke endpoint Snap untuk membuat transaksi QRIS.
 */
export class MidtransProvider implements PaymentProvider {
  readonly name = "midtrans";

  private get serverKey(): string {
    if (!env.MIDTRANS_SERVER_KEY) throw new Error("MIDTRANS_SERVER_KEY tidak terkonfigurasi.");
    return env.MIDTRANS_SERVER_KEY;
  }

  private get baseUrl(): string {
    return env.MIDTRANS_IS_PRODUCTION ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com";
  }

  async createQrisPayment(input: PaymentOrderInput): Promise<PaymentCreateResult> {
    const auth = Buffer.from(`${this.serverKey}:`).toString("base64");
    const body = {
      payment_type: "qris",
      transaction_details: {
        order_id: input.orderNumber,
        gross_amount: input.amount,
      },
      qris: { acquirer: "gopay" },
      customer_details: {
        first_name: input.customerName,
        phone: input.customerPhone ?? undefined,
        email: input.customerEmail ?? undefined,
      },
    };

    const res = await fetch(`${this.baseUrl}/v2/charge`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      const message = (json as { status_message?: string })?.status_message ?? `Midtrans error ${res.status}`;
      throw new Error(message);
    }
    const providerRef = String((json as { transaction_id?: string }).transaction_id ?? input.orderNumber);
    const actions = (json as { actions?: { name: string; url: string }[] }).actions ?? [];
    const qrAction = actions.find((a) => a.name === "generate-qr-code");
    const expiry = (json as { expiry_time?: string }).expiry_time;
    return {
      providerRef,
      qrCodeUrl: qrAction?.url,
      qrPayload: qrAction?.url,
      expiresAt: expiry ? new Date(expiry) : undefined,
      raw: json,
    };
  }

  verifySignature(payload: unknown, _signature: string | null): boolean {
    const p = payload as {
      order_id?: string;
      status_code?: string;
      gross_amount?: string;
      signature_key?: string;
    };
    if (!p?.order_id || !p?.status_code || !p?.gross_amount || !p?.signature_key) return false;
    const expected = crypto
      .createHash("sha512")
      .update(`${p.order_id}${p.status_code}${p.gross_amount}${this.serverKey}`)
      .digest("hex");
    return expected === p.signature_key;
  }

  parseWebhook(payload: unknown): ParsedWebhook {
    const p = payload as {
      order_id?: string;
      transaction_id?: string;
      transaction_status?: string;
      gross_amount?: string;
      fraud_status?: string;
    };
    if (!p?.order_id || !p?.transaction_id || !p?.transaction_status) {
      throw new Error("Invalid Midtrans webhook payload");
    }
    let status: ParsedWebhook["status"] = "PENDING";
    const ts = p.transaction_status;
    if (ts === "settlement" || (ts === "capture" && p.fraud_status === "accept")) status = "PAID";
    else if (ts === "deny" || ts === "cancel" || ts === "failure") status = "FAILED";
    else if (ts === "expire") status = "EXPIRED";
    return {
      rawEventId: p.transaction_id,
      orderNumber: p.order_id,
      amount: Math.round(parseFloat(p.gross_amount ?? "0")),
      status,
      providerRef: p.transaction_id,
    };
  }
}
