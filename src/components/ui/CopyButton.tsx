"use client";

import { useState } from "react";
import { Copy, Check } from "@phosphor-icons/react";

/** Inline copy-to-clipboard with transient checkmark feedback. */
export default function CopyButton({ value, label, className }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <button
      onClick={copy}
      className={className ?? "pill pill-ghost pill-sm"}
      style={{ border: "1px solid var(--hairline-light)", minHeight: 34, padding: "6px 12px" }}
      aria-label={label ?? "Copy"}
    >
      {copied ? <Check size={14} weight="bold" /> : <Copy size={14} />}
      {label && <span>{copied ? "Tersalin" : label}</span>}
    </button>
  );
}
