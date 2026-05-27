"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch, Copy, Check, Trash, Globe } from "@phosphor-icons/react";
import { GLYPH } from "@/lib/glyphs";

interface DomainState {
  slug: string;
  domain: string | null;
  status: "NONE" | "PENDING" | "VERIFIED" | "ACTIVE" | "FAILED";
  verifyToken: string | null;
  verifiedAt: string | null;
  rootDomain: string;
}

const STATUS_LABELS: Record<DomainState["status"], { label: string; color: string }> = {
  NONE:     { label: "Belum diatur", color: "var(--shade-50)" },
  PENDING:  { label: "Menunggu verifikasi DNS", color: "#d97706" },
  VERIFIED: { label: "Terverifikasi", color: "var(--ink)" },
  ACTIVE:   { label: "Aktif", color: "#10b981" },
  FAILED:   { label: "Verifikasi gagal", color: "#e11d48" },
};

const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(\.[a-z0-9-]{1,63})+$/i;

export default function DomainManager({ initial }: { initial: DomainState }) {
  const router = useRouter();
  const [state, setState] = useState<DomainState>(initial);
  const [input, setInput] = useState(initial.domain ?? "");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState<string | null>(null);

  const status = STATUS_LABELS[state.status];

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  async function claim() {
    setError("");
    if (!DOMAIN_RE.test(input)) {
      setError("Format domain tidak valid. Contoh: tokoanda.com, www.tokoanda.com");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/dashboard/domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: input.toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal mengatur domain.");
        return;
      }
      setState({
        ...state,
        domain: data.domain,
        status: data.status,
        verifyToken: data.verifyToken,
      });
      router.refresh();
    });
  }

  async function verify() {
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/dashboard/domain", { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal verifikasi.");
        return;
      }
      setState({
        ...state,
        status: data.status,
        verifiedAt: data.verified ? new Date().toISOString() : null,
      });
      if (!data.verified) {
        setError(
          `TXT record belum ter-detect. Pastikan _umkmstore-verify.${state.domain} sudah berisi token.`,
        );
      }
      router.refresh();
    });
  }

  async function release() {
    if (!confirm("Hapus custom domain? Storefront akan kembali ke /store/{slug}.")) return;
    startTransition(async () => {
      await fetch("/api/dashboard/domain", { method: "DELETE" });
      setState({ ...state, domain: null, status: "NONE", verifyToken: null, verifiedAt: null });
      setInput("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="alert" role="alert">
          <span className="glyph mr-2">{GLYPH.reference}</span>{error}
        </div>
      )}

      {/* Current state */}
      <section className="card">
        <p className="eyebrow-cap mb-2"><span className="glyph">{GLYPH.circle}</span> Status</p>
        <div className="flex items-center gap-3 flex-wrap">
          <Globe size={20} style={{ color: status.color }} />
          <p className="heading-md">{state.domain ?? `(${state.slug}.umkmstore.id default)`}</p>
          <span
            className="caption tabular"
            style={{
              padding: "2px 10px",
              borderRadius: 9999,
              background: status.color,
              color: "var(--on-primary)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              fontSize: 11,
            }}
          >
            {status.label}
          </span>
        </div>
        {state.verifiedAt && (
          <p className="micro tabular mt-2" style={{ color: "var(--shade-50)" }}>
            Verified {new Date(state.verifiedAt).toLocaleString("id-ID")}
          </p>
        )}
      </section>

      {/* Claim form */}
      {state.status === "NONE" || state.status === "FAILED" ? (
        <section className="card">
          <p className="eyebrow-cap mb-2"><span className="glyph">{GLYPH.sparkle}</span> Daftar domain baru</p>
          <h2 className="heading-md mb-2">Pakai domain Anda sendiri</h2>
          <p className="caption mb-4" style={{ color: "var(--shade-60)" }}>
            Mis. <code style={{ fontFamily: "var(--font-mono)" }}>tokoanda.com</code> atau <code style={{ fontFamily: "var(--font-mono)" }}>belanja.brand.id</code>.
            Anda akan dapat token TXT yang harus ditambahkan di DNS provider Anda.
          </p>
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="tokoanda.com"
              className="input flex-1"
              style={{ minWidth: 240, fontFamily: "var(--font-mono)" }}
              spellCheck={false}
              autoComplete="off"
            />
            <button onClick={claim} disabled={pending || !input} className="pill pill-primary">
              {pending ? <CircleNotch size={16} className="animate-spin" /> : null}
              Daftar domain
            </button>
          </div>
        </section>
      ) : null}

      {/* DNS instructions */}
      {state.verifyToken && state.domain ? (
        <section className="card">
          <p className="eyebrow-cap mb-2"><span className="glyph">{GLYPH.therefore}</span> Setup DNS</p>
          <h2 className="heading-md mb-3">Tambahkan 2 record di DNS provider Anda</h2>
          <p className="caption mb-4" style={{ color: "var(--shade-60)" }}>
            Login ke Niagahoster, Cloudflare, atau registrar Anda, lalu tambahkan record berikut. Propagasi DNS biasanya 5–30 menit.
          </p>

          <DnsRow
            label="1. CNAME (storefront pointing)"
            type="CNAME"
            host={state.domain.includes(".") && !state.domain.startsWith("www.") ? "@ atau www" : "www"}
            value={`cname.${state.rootDomain}`}
            copyKey="cname"
            copied={copied === "cname"}
            onCopy={(v) => copy(v, "cname")}
          />

          <DnsRow
            label="2. TXT (ownership verification)"
            type="TXT"
            host={`_umkmstore-verify.${state.domain}`}
            value={state.verifyToken}
            copyKey="txt"
            copied={copied === "txt"}
            onCopy={(v) => copy(v, "txt")}
          />

          <div className="flex gap-2 mt-4 flex-wrap">
            <button onClick={verify} disabled={pending} className="pill pill-primary">
              {pending ? <CircleNotch size={16} className="animate-spin" /> : <Check size={16} weight="bold" />}
              Verifikasi sekarang
            </button>
            <button onClick={release} disabled={pending} className="pill pill-outline-light">
              <Trash size={16} /> Hapus domain
            </button>
          </div>

          <p className="micro mt-4" style={{ color: "var(--shade-50)" }}>
            <span className="glyph">{GLYPH.reference}</span> Setelah TXT terverifikasi, kami akan provisioning SSL otomatis (Let&apos;s Encrypt) — ~30 detik. Setelah ACTIVE, storefront akan accessible di {state.domain}.
          </p>
        </section>
      ) : null}

      {/* Active state — quick actions */}
      {state.status === "ACTIVE" || state.status === "VERIFIED" ? (
        <section className="card">
          <p className="eyebrow-cap mb-2"><span className="glyph">{GLYPH.done}</span> Domain aktif</p>
          <p className="body-md mb-3">
            Storefront Anda dapat diakses di:{" "}
            <a
              href={`https://${state.domain}`}
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--ink)", fontWeight: 550, textDecoration: "underline" }}
            >
              {state.domain}
            </a>
          </p>
          <div className="flex gap-2 flex-wrap">
            <button onClick={release} className="pill pill-outline-light">
              <Trash size={16} /> Hapus domain
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function DnsRow({
  label, type, host, value, copyKey, copied, onCopy,
}: {
  label: string; type: string; host: string; value: string;
  copyKey: string; copied: boolean; onCopy: (v: string) => void;
}) {
  return (
    <div className="card-flat" style={{ padding: 14, marginBottom: 10 }}>
      <p className="micro tabular mb-2" style={{ color: "var(--shade-60)" }}>{label}</p>
      <div className="grid gap-2 sm:grid-cols-3" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
        <Field label="Type" value={type} />
        <Field label="Host" value={host} mono />
        <Field
          label="Value"
          value={value}
          mono
          onCopy={() => onCopy(value)}
          copied={copied}
          copyKey={copyKey}
        />
      </div>
    </div>
  );
}

function Field({
  label, value, mono, onCopy, copied,
}: {
  label: string; value: string; mono?: boolean; onCopy?: () => void; copied?: boolean; copyKey?: string;
}) {
  return (
    <div>
      <p className="micro" style={{ color: "var(--shade-50)", marginBottom: 4 }}>{label}</p>
      <div className="flex items-center gap-2">
        <code
          className="flex-1 truncate"
          style={{
            background: "var(--canvas-cream)",
            padding: "6px 10px",
            borderRadius: 6,
            fontFamily: mono ? "var(--font-mono)" : "inherit",
            fontSize: 12,
            border: "1px solid var(--hairline-light)",
          }}
          title={value}
        >
          {value}
        </code>
        {onCopy && (
          <button
            onClick={onCopy}
            className="pill pill-ghost pill-sm"
            style={{ minHeight: 32, padding: "6px 10px", border: "1px solid var(--hairline-light)" }}
            aria-label="Copy"
          >
            {copied ? <Check size={14} weight="bold" /> : <Copy size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}
