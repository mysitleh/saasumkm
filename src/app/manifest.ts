import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UMKMStore — Toko Digital UMKM",
    short_name: "UMKMStore",
    description: "Platform SaaS untuk UMKM Indonesia. Buat toko digital, terima order, dan pembayaran QRIS.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#16a34a",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
