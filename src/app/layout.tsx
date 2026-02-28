import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
const inter = Inter({ subsets: ["latin"] });
export const metadata: Metadata = {
  title: "UMKMStore — Platform Toko Digital UMKM",
  description: "Platform SaaS untuk UMKM Indonesia. Buat toko digital, terima order, dan pembayaran QRIS.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
