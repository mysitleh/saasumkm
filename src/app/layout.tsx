import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

/**
 * Single-family typography per design.md:
 * - Inter Variable handles BOTH display (thin 300–500) and UI (body 420–550).
 *   Inter is the canonical open substitute for Neue Haas Grotesk Display
 *   when used at thin weights (the spec explicitly calls this out).
 * - We load Inter once and expose two CSS vars (--font-sans + --font-display)
 *   pointing to the same family, so design.md utility classes can reference
 *   either token without re-downloading the font.
 * - The OpenType `ss03` stylistic set is enabled globally in globals.css.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "UMKMStore — Platform Toko Digital UMKM",
  description:
    "Platform SaaS untuk UMKM Indonesia. Buat toko digital, terima order via QRIS, dan kelola bisnis dengan business intelligence kelas internasional.",
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "UMKMStore — Toko Digital + Business Intelligence untuk UMKM",
    description:
      "Buat toko digital, terima order, dan baca bisnis Anda lewat RFM, forecasting, dan cohort analysis — semua dari satu dashboard.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={inter.variable}
      // Alias --font-display to the same Inter variable so design.md utility
      // classes (.display-xxl, .display-md, etc.) get the thin-weight cut
      // without an additional network request.
      style={{ ["--font-display" as string]: "var(--font-sans)" }}
    >
      <body className={inter.className}>
        <SessionProvider>{children}</SessionProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
