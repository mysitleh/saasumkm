import { redirect } from "next/navigation";
import Link from "next/link";
import { isPlatformAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { UStoreMark } from "@/components/icons";
import { GLYPH } from "@/lib/glyphs";
import ToastProvider, { ToastKeyframes } from "@/components/ui/Toast";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (!(await isPlatformAdmin())) redirect("/dashboard");

  return (
    <ToastProvider>
      <ToastKeyframes />
      <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--canvas-night)", color: "var(--on-primary)" }}>
        {/* Cinematic admin top bar — distinct from tenant dashboard */}
        <header
          className="sticky top-0 z-40"
          style={{ background: "var(--canvas-night)", borderBottom: "1px solid var(--hairline-dark)", height: 56 }}
        >
          <div className="flex items-center justify-between gap-3 px-5 md:px-8 h-full">
            <div className="flex items-center gap-3 min-w-0">
              <UStoreMark size="sm" variant="on-primary" />
              <span style={{ color: "var(--hairline-dark)" }}>│</span>
              <span
                className="eyebrow-cap on-dark"
                style={{ background: "var(--aloe-10)", color: "var(--ink)", padding: "3px 10px", borderRadius: 9999 }}
              >
                {GLYPH.sparkle} Platform Admin
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="caption hidden sm:inline" style={{ color: "var(--link-cool-3)" }}>
                {session.user.email}
              </span>
              <Link href="/dashboard" className="caption hover:underline" style={{ color: "var(--on-primary)" }}>
                ← Dashboard toko
              </Link>
            </div>
          </div>
        </header>

        <main className="px-5 py-7 md:px-8 md:py-9 ums-page-enter" style={{ maxWidth: 1280, margin: "0 auto" }}>
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
