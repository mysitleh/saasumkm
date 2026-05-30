import LogoMark from "./LogoMark";
import { DEFAULT_LOGO, type LogoConfig } from "@/lib/logo";

interface Props {
  className?: string;
  size?: number;
  /** Override the mark fill. Defaults to brand ink so it adapts to canvas. */
  tone?: "brand" | "ink" | "on-primary";
  /** Optional full logo config (overrides tone-based defaults). */
  config?: Partial<LogoConfig>;
  idSeed?: string;
}

/**
 * UMKMStore monogram — now a thin wrapper over the flexible LogoMark system.
 * Keeps the original `tone` API for backward compatibility, mapping each tone
 * to an appropriate LogoConfig so every existing call site keeps working.
 */
export default function UMonogram({ className, size = 28, tone = "brand", config, idSeed }: Props) {
  const toneConfig: Partial<LogoConfig> =
    tone === "on-primary"
      ? { ...DEFAULT_LOGO, fill: "solid", color: "#ffffff", symbolColor: "#0a0a0a", accent: "#c1fbd4" }
      : tone === "ink"
        ? { ...DEFAULT_LOGO, fill: "solid", color: "#0a0a0a", symbolColor: "#ffffff", accent: "#c1fbd4" }
        : DEFAULT_LOGO;

  return (
    <LogoMark
      size={size}
      className={className}
      idSeed={idSeed ?? tone}
      config={{ ...toneConfig, ...config }}
    />
  );
}
