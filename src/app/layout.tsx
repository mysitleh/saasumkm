import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

/**
 * Typography — Plus Jakarta Sans (Tokotype, Indonesia).
 * A geometric-humanist sans with a friendly, modern SaaS feel — matches the
 * isometricon.com aesthetic (warm-clean cards, rounded, colorful).
 * - One family powers both display (weight 300–600) and UI (400–600).
 * - We expose --font-sans + --font-display pointing to the same family so
 *   design.md utility classes can reference either token.
 */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
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
      className={jakarta.variable}
      // Alias --font-display to the same Inter variable so design.md utility
      // classes (.display-xxl, .display-md, etc.) get the thin-weight cut
      // without an additional network request.
      style={{ ["--font-display" as string]: "var(--font-sans)" }}
    >
      <body className={jakarta.className}>
        <SessionProvider>{children}</SessionProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
