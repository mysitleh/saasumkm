import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import ToastProvider, { ToastKeyframes } from "@/components/ui/Toast";
import { isPlatformAdmin } from "@/lib/admin";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || !["OWNER", "CASHIER"].includes(session.user.role)) redirect("/login");
  const admin = await isPlatformAdmin();
  return (
    <ToastProvider>
      <ToastKeyframes />
      <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--canvas-cream)" }}>
        <DashboardNav session={session} isAdmin={admin} />
        {/*
          Full-bleed main: padding scales by breakpoint, no inner max-width
          cap. `min-w-0` prevents long Rupiah numbers / wide tables from
          forcing horizontal scroll on the page itself.
        */}
        <main className="px-4 py-6 md:px-8 md:py-8 lg:px-10 lg:py-10 xl:px-12 min-w-0 overflow-x-hidden ums-page-enter">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
