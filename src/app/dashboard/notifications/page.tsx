import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GLYPH } from "@/lib/glyphs";
import { hasFeature } from "@/lib/features";
import FeatureGate from "@/components/FeatureGate";
import NotificationSettings from "./NotificationSettings";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user.tenantId) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  if (!(await hasFeature(session.user.tenantId, "dailyDigest"))) {
    return (
      <FeatureGate
        requiredPlan="Pro"
        title="Laporan harian otomatis."
        description="Kirim ringkasan harian per-outlet via WhatsApp & Telegram otomatis. Tersedia di paket Pro ke atas."
      />
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: {
      phone: true,
      notifyWhatsapp: true,
      notifyTelegram: true,
      telegramChatId: true,
      dailyDigestEnabled: true,
      dailyDigestHour: true,
      lowStockThreshold: true,
    },
  });
  if (!tenant) redirect("/dashboard");

  const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? null;

  return (
    <div className="page-shell reading-col">
      <div className="page-header">
        <p className="eyebrow-cap mb-2"><span className="glyph">{GLYPH.circleRing}</span> Notifikasi</p>
        <h1 className="display-md">Laporan harian otomatis.</h1>
        <p className="body-md mt-2" style={{ color: "var(--shade-50)" }}>
          Atur ke mana laporan harian dikirim — WhatsApp, Telegram, atau keduanya. Lengkap dengan breakdown per outlet.
        </p>
      </div>

      <NotificationSettings initial={tenant} botUsername={botUsername} />
    </div>
  );
}
