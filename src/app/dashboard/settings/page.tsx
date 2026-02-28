import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SettingsForm from "./SettingsForm";
export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user.tenantId || session.user.role !== "OWNER") redirect("/dashboard");
  const tenant = await prisma.tenant.findUnique({ where: { id: session.user.tenantId } });
  if (!tenant) redirect("/dashboard");
  return (
    <div className="md:ml-56 pb-20 md:pb-6 max-w-2xl">
      <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">Pengaturan Toko</h1><p className="text-gray-600 text-sm mt-1">Kelola profil toko dan pengaturan pembayaran</p></div>
      <SettingsForm tenant={tenant}/>
    </div>
  );
}
