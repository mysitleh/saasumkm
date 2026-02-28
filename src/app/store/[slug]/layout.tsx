import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
interface Props { children: React.ReactNode; params: Promise<{ slug: string }>; }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) return { title: "Toko tidak ditemukan" };
  return { title: `${tenant.name} — UMKMStore`, description: tenant.description || `Toko digital ${tenant.name}` };
}
export default async function StoreLayout({ children, params }: Props) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant || !tenant.isActive) notFound();
  return <>{children}</>;
}
