"use client";

import Link from "next/link";
import { GLYPH } from "@/lib/glyphs";

interface Step {
  label: string;
  done: boolean;
  href: string;
}

/**
 * Setup checklist, design.md-compliant.
 * Uses the pistachio band as a wide horizontal feature card (light track only),
 * with a thin progress bar in ink and unicode markers for completed/pending.
 */
export default function OnboardingBanner({ steps }: { steps: Step[] }) {
  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;
  if (completed >= total) return null;

  const nextStep = steps.find((s) => !s.done);
  const progress = Math.round((completed / total) * 100);

  return (
    <div className="card-pistachio-band mb-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <p className="eyebrow-cap" style={{ color: "var(--shade-60)" }}>
            <span className="glyph">{GLYPH.hexMolecule}</span> Setup Toko
          </p>
          <p className="heading-sm mt-1 tabular">{completed}/{total} langkah selesai · {progress}%</p>
        </div>
        {nextStep && (
          <Link href={nextStep.href} className="pill pill-primary pill-sm">
            Lanjutkan <span className="glyph">{GLYPH.arrow}</span>
          </Link>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ width: "100%", height: 4, background: "rgba(0,0,0,0.08)", borderRadius: 9999, overflow: "hidden" }} className="mb-4">
        <div style={{ width: `${progress}%`, height: "100%", background: "var(--ink)", transition: "width .25s ease" }} />
      </div>

      {/* Steps */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {steps.map((step) => (
          <Link
            key={step.label}
            href={step.href}
            className="flex items-center gap-2 caption hover:underline"
            style={{ color: step.done ? "var(--shade-50)" : "var(--ink)" }}
          >
            <span className="glyph" style={{ color: step.done ? "var(--ink)" : "var(--shade-50)" }}>
              {step.done ? GLYPH.done : GLYPH.pending}
            </span>
            <span style={step.done ? { textDecoration: "line-through", textDecorationColor: "var(--shade-40)" } : undefined}>
              {step.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
