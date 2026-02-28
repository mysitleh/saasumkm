"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, Eye, EyeOff, Loader2 } from "lucide-react";
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) setError("Email atau password salah.");
    else { router.push("/dashboard"); router.refresh(); }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4"><ShoppingBag className="w-8 h-8 text-green-600"/><span className="text-2xl font-bold text-gray-900">UMKMStore</span></Link>
          <h1 className="text-2xl font-bold text-gray-900">Masuk ke Akun</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="email@toko.com"/></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative"><input type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 pr-10" placeholder="••••••••"/>
                <button type="button" onClick={()=>setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPass?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading&&<Loader2 className="w-4 h-4 animate-spin"/>}{loading?"Memproses...":"Masuk"}
            </button>
          </form>
          <p className="text-center text-sm text-gray-600 mt-6">Belum punya akun? <Link href="/register" className="text-green-600 font-semibold hover:underline">Daftar gratis</Link></p>
        </div>
      </div>
    </div>
  );
}
