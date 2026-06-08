"use client";

import { useState } from "react";
import { Share, CircleNotch, Check } from "@phosphor-icons/react";

/**
 * ReceiptShareButton — fetch struk teks dari /api/store/[slug]/receipt/[id]
 * lalu copy ke clipboard atau buka WA share dengan teks pre-filled.
 */
export default function ReceiptShareButton({
  slug,
  orderId,
}: {
  slug: string;
  orderId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    setLoading(true);
    try {
      const res = await fetch(`/api/store/${slug}/receipt/${orderId}?format=wa`);
      if (!res.ok) throw new Error("Gagal ambil struk");
      const { receipt } = (await res.json()) as { receipt: string };

      // Coba Web Share API dulu (mobile native)
      if (typeof navigator !== "undefined" && "share" in navigator) {
        try {
          await navigator.share({ text: receipt });
          return;
        } catch {
          // user cancel atau API tidak support → fallback ke clipboard
        }
      }

      // Fallback: copy ke clipboard
      await navigator.clipboard.writeText(receipt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal share struk");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-[20px] p-4 shadow-sm mb-4">
      <button
        type="button"
        onClick={handleShare}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[14px] bg-[var(--accent)] text-white font-medium text-sm transition-opacity disabled:opacity-50"
      >
        {loading ? (
          <CircleNotch size={16} className="animate-spin" />
        ) : copied ? (
          <Check size={16} weight="bold" />
        ) : (
          <Share size={16} />
        )}
        <span>
          {loading ? "Memuat..." : copied ? "Disalin ke clipboard!" : "Bagikan struk"}
        </span>
      </button>
    </div>
  );
}
