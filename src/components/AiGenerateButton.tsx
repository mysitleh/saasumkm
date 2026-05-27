"use client";

import { useState } from "react";
import { Sparkle, CircleNotch } from "@phosphor-icons/react";

interface Props {
  productName: string;
  category?: string;
  type?: "description" | "promo";
  onGenerated: (text: string) => void;
}

export default function AiGenerateButton({ productName, category, type = "description", onGenerated }: Props) {
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!productName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, category, type }),
      });
      const data = await res.json();
      if (res.ok && data.text) {
        onGenerated(data.text);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={generate}
      disabled={loading || !productName.trim()}
      className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
      title="Generate dengan AI"
    >
      {loading ? <CircleNotch size={12} className="animate-spin" /> : <Sparkle size={12} />}
      {loading ? "Generating..." : "AI Generate"}
    </button>
  );
}
