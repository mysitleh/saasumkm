import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import ToastProvider, { ToastKeyframes } from "@/components/ui/Toast";
import { isPlatformAdmin } from "@/lib/admin";
import MarqueeTicker from "@/components/MarqueeTicker";
import { buildReminders } from "@/lib/reminders";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || !["OWNER", "CASHIER"].includes(session.user.role)) redirect("/login");
  const admin = await isPlatformAdmin();
  const reminders = session.user.tenantId
    ? await buildReminders(session.user.tenantId)
    : { items: [], hasAlert: false };
  const alertCount = reminders.items.filter((i) => i.alert).length;
  return (
    <ToastProvider>
      <ToastKeyframes />
      <div className="min-h-screen overflow-x-hidden" style={{ background: "linear-gradient(180deg, var(--canvas-warm) 0%, var(--canvas-cream) 40%)" }}>
        <DashboardNav session={session} isAdmin={admin} notifications={reminders.items} alertCount={alertCount} />
        {/*
          Full-bleed main: padding scales by breakpoint, no inner max-width
          cap. `min-w-0` prevents long Rupiah numbers / wide tables from
          forcing horizontal scroll on the page itself.
        */}
        <main className="px-4 py-6 md:px-8 md:py-8 lg:px-10 lg:py-10 xl:px-12 min-w-0 overflow-x-hidden ums-page-enter">
          {reminders.items.length > 0 && (
            <div className="ticker-shell mb-6">
              <MarqueeTicker
                items={reminders.items}
                tag={reminders.hasAlert ? "Perlu Aksi" : "Info"}
                alert={reminders.hasAlert}
              />
            </div>
          )}
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
