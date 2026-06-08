
import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-24 px-4">
      <div className="max-w-5xl mx-auto text-center space-y-12">
        <h1 className="text-4xl font-bold text-slate-900">Pilih Paket Sesuai Kebutuhan Bisnis Anda</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">Kami menyediakan berbagai pilihan paket berlangganan dengan fitur yang dapat diskalakan sesuai dengan pertumbuhan UMKM Anda.</p>
        
        <div className="grid md:grid-cols-3 gap-8 text-left mt-12">
          {/* Free */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-2xl font-bold">Gratis</h3>
            <p className="text-3xl font-black mt-4">Rp 0<span className="text-sm text-slate-500 font-normal">/bulan</span></p>
            <ul className="mt-6 space-y-3 text-slate-600 text-sm">
              <li>✅ 100 Chat / Bulan</li>
              <li>✅ 5 Item Knowledge Base</li>
              <li>✅ 1 Sesi WhatsApp</li>
              <li>❌ Tidak ada Auto Lead Capture</li>
            </ul>
            <Link href="/register" className="mt-8 block w-full py-3 text-center border border-blue-600 text-blue-600 rounded-xl font-medium hover:bg-blue-50">Coba Gratis</Link>
          </div>
          {/* Pro */}
          <div className="bg-blue-600 p-8 rounded-2xl border border-blue-600 shadow-xl text-white transform md:-translate-y-4">
            <div className="bg-white text-blue-600 text-xs font-bold px-3 py-1 rounded-full w-max mb-4">PALING POPULER</div>
            <h3 className="text-2xl font-bold">Pro UMKM</h3>
            <p className="text-3xl font-black mt-4">Rp 99.000<span className="text-sm text-blue-200 font-normal">/bulan</span></p>
            <ul className="mt-6 space-y-3 text-blue-50 text-sm">
              <li>✅ 3.000 Chat / Bulan</li>
              <li>✅ 50 Item Knowledge Base</li>
              <li>✅ 1 Sesi WhatsApp</li>
              <li>✅ Auto Lead Capture</li>
              <li>✅ Human Handover</li>
            </ul>
            <Link href="/register" className="mt-8 block w-full py-3 text-center bg-white text-blue-600 rounded-xl font-bold hover:bg-slate-100 shadow-md">Berlangganan Pro</Link>
          </div>
          {/* Enterprise */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-2xl font-bold">Bisnis Plus</h3>
            <p className="text-3xl font-black mt-4">Rp 299.000<span className="text-sm text-slate-500 font-normal">/bulan</span></p>
            <ul className="mt-6 space-y-3 text-slate-600 text-sm">
              <li>✅ 10.000 Chat / Bulan</li>
              <li>✅ 200 Item Knowledge Base</li>
              <li>✅ 3 Sesi WhatsApp</li>
              <li>✅ Semua Fitur Pro</li>
              <li>✅ Akses n8n Webhook</li>
            </ul>
            <Link href="/register" className="mt-8 block w-full py-3 text-center border border-blue-600 text-blue-600 rounded-xl font-medium hover:bg-blue-50">Hubungi Kami</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
