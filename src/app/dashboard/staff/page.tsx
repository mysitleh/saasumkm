import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { hasFeature } from "@/lib/features";
import { UsersThree } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { GLYPH } from "@/lib/glyphs";
import StaffList from "./StaffList";
import StaffForm from "./StaffForm";
import MarqueeHeading from "@/components/MarqueeHeading";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const session = await auth();
  if (!session?.user.tenantId || session.user.role !== "OWNER") redirect("/dashboard");

  const canManageStaff = await hasFeature(session.user.tenantId, "staffManagement");

  if (!canManageStaff) {
    return (
      <div className="page-shell">
        <div className="page-header">
          <p className="eyebrow-cap mb-2"><span className="glyph">{GLYPH.lozenge}</span> Staff</p>
          <MarqueeHeading text="Staff management" />
        </div>
        <div className="card text-center max-w-xl mx-auto" style={{ padding: 48 }}>
          <span className="empty-state-glyph glyph">{GLYPH.lozenge}</span>
          <h2 className="heading-md mb-2">Fitur Paket Business</h2>
          <p className="body-md mb-6" style={{ color: "var(--shade-50)" }}>
            Kelola kasir dan staff toko Anda. Tersedia di paket Business.
          </p>
          <Link href="/dashboard/billing" className="pill pill-primary inline-flex">
            Upgrade ke Business <span className="glyph">{GLYPH.arrow}</span>
          </Link>
        </div>
      </div>
    );
  }

  const staff = await prisma.user.findMany({
    where: { tenantId: session.user.tenantId, role: "CASHIER" },
    select: { id: true, name: true, email: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="page-shell">
      <div className="page-header">
        <p className="eyebrow-cap mb-2"><span className="glyph">{GLYPH.lozenge}</span> Staff</p>
        <MarqueeHeading text="Staff management" />
        <p className="body-md mt-2 tabular" style={{ color: "var(--shade-50)" }}>
          {staff.length} kasir aktif
        </p>
      </div>

      <section className="card mb-6">
        <h2 className="heading-md mb-4 flex items-center gap-2">
          <UsersThree size={18} /> Tambah kasir baru
        </h2>
        <StaffForm />
      </section>

      <StaffList staff={staff} />
    </div>
  );
}
