import Link from "next/link";
import { ShoppingBag, QrCode, BarChart3, Smartphone, CheckCircle, ArrowRight } from "lucide-react";
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2"><ShoppingBag className="w-7 h-7 text-green-600"/><span className="text-xl font-bold">UMKMStore</span></div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 font-medium">Masuk</Link>
            <Link href="/register" className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700">Daftar Gratis</Link>
          </div>
        </div>
      </nav>
      <section className="bg-gradient-to-br from-green-50 to-emerald-100 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Buka Toko Digital UMKM<br/><span className="text-green-600">Dalam 5 Menit</span></h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">Kelola produk, terima order, dan bayar via QRIS — semua dalam satu platform yang mudah digunakan dari HP.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold text-lg hover:bg-green-700 flex items-center justify-center gap-2">Mulai Gratis <ArrowRight className="w-5 h-5"/></Link>
            <Link href="/store/demo" className="bg-white text-green-700 border border-green-200 px-8 py-3 rounded-xl font-semibold text-lg hover:bg-green-50">Lihat Demo Toko</Link>
          </div>
        </div>
      </section>
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Semua yang UMKM Butuhkan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[{icon:<ShoppingBag className="w-8 h-8 text-green-600"/>,title:"Toko Digital",desc:"Katalog produk dengan foto, harga, dan stok."},{icon:<QrCode className="w-8 h-8 text-blue-600"/>,title:"Pembayaran QRIS",desc:"Terima pembayaran QRIS statis & dinamis."},{icon:<BarChart3 className="w-8 h-8 text-purple-600"/>,title:"Dashboard",desc:"Pantau omzet dan order dari dashboard simpel."},{icon:<Smartphone className="w-8 h-8 text-orange-600"/>,title:"Mobile-First",desc:"Didesain untuk HP. Kelola dari mana saja."}].map((f,i)=>(
              <div key={i} className="bg-gray-50 rounded-2xl p-6 hover:shadow-md transition-shadow">
                <div className="mb-4">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Harga Transparan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[{name:"Basic",price:"Gratis",color:"border-gray-200",features:["1 toko","50 produk","QRIS statis","Order manual"]},{name:"Pro",price:"Rp 99.000/bln",color:"border-green-500",features:["Produk unlimited","QRIS dinamis","Notifikasi WA","Promo & diskon"]},{name:"Business",price:"Rp 299.000/bln",color:"border-purple-500",features:["Multi outlet","Staff management","Analytics lanjutan","Priority support"]}].map((plan,i)=>(
              <div key={i} className={`bg-white rounded-2xl p-6 border-2 ${plan.color}`}>
                <h3 className="font-bold text-xl text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-2xl font-extrabold text-green-600 mb-4">{plan.price}</p>
                <ul className="space-y-2 mb-6">{plan.features.map((f,j)=><li key={j} className="flex items-center gap-2 text-sm text-gray-700"><CheckCircle className="w-4 h-4 text-green-500"/>{f}</li>)}</ul>
                <Link href="/register" className="block text-center bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700">Mulai Sekarang</Link>
              </div>
            ))}
          </div>
        </div>
      </section>
      <footer className="bg-gray-900 text-gray-400 py-8 px-4 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-2"><ShoppingBag className="w-5 h-5 text-green-500"/><span className="text-white font-bold">UMKMStore</span></div>
        <p>© 2026 UMKMStore. Platform SaaS untuk UMKM Indonesia.</p>
      </footer>
    </div>
  );
}
