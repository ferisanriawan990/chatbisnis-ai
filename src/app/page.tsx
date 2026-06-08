import Link from 'next/link';
import { Bot, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white text-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-4 rounded-2xl shadow-xl shadow-blue-200">
            <Bot className="w-12 h-12 text-white" />
          </div>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
          ChatBisnis AI
        </h1>
        
        <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-600 mb-10">
          Solusi Asisten Virtual Cerdas untuk UMKM Indonesia. Hubungkan WhatsApp, latih AI dengan data bisnis Anda, dan layani pelanggan 24/7.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/dashboard/chatbot" className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-all shadow-lg shadow-blue-200 hover:-translate-y-0.5">
            Masuk ke Dashboard <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-left">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="text-blue-600 mb-4"><CheckCircle2 className="w-8 h-8" /></div>
            <h3 className="font-bold text-lg mb-2">Terintegrasi WAHA</h3>
            <p className="text-slate-600">Hubungkan nomor WhatsApp bisnis Anda dengan mudah menggunakan engine WAHA yang stabil.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="text-blue-600 mb-4"><CheckCircle2 className="w-8 h-8" /></div>
            <h3 className="font-bold text-lg mb-2">AI Super Cerdas</h3>
            <p className="text-slate-600">Didukung oleh model AI terkini untuk membalas pelanggan dengan gaya bahasa pilihan Anda.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="text-blue-600 mb-4"><CheckCircle2 className="w-8 h-8" /></div>
            <h3 className="font-bold text-lg mb-2">Database Custom</h3>
            <p className="text-slate-600">Upload Excel, PDF, atau hubungkan Google Sheets agar AI membalas persis sesuai produk Anda.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
