import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || !["OWNER","CASHIER"].includes(session.user.role)) redirect("/login");
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav session={session}/>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
