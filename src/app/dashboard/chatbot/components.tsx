import React from 'react';
import { CheckCircle2, Database, Bot, MessageSquare, Key, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

/* eslint-disable @typescript-eslint/no-explicit-any */

export const BusinessProfileForm = ({ form, handleChange, isComplete }: any) => (
  <section className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-500 relative overflow-hidden group">
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-100/50 to-transparent rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110"></div>
    <div className="absolute top-0 right-0 p-6 z-10">
      {isComplete ? <CheckCircle2 className="w-10 h-10 text-emerald-400 drop-shadow-md" /> : <span className="text-5xl font-black text-slate-100 drop-shadow-sm">1</span>}
    </div>
    <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 mb-6 flex items-center gap-3 relative z-10">
      <div className="p-2.5 bg-indigo-50 rounded-xl">
        <Database className="w-6 h-6 text-indigo-600" />
      </div>
      Step 1: Profil Bisnis
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Nama Bisnis <span className="text-red-500">*</span></label>
        <input name="businessName" value={form.businessName} onChange={handleChange} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm hover:border-indigo-300" placeholder="Cth: Warung Kopi Mantap" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Bidang Usaha <span className="text-red-500">*</span></label>
        <input name="businessIndustry" value={form.businessIndustry} onChange={handleChange} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm hover:border-indigo-300" placeholder="Cth: F&B / Restoran" />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Deskripsi Singkat (Diberitahukan ke AI) <span className="text-red-500">*</span></label>
        <textarea name="businessDescription" value={form.businessDescription} onChange={handleChange} rows={3} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm hover:border-indigo-300 resize-none" placeholder="Cth: Kami menjual kopi susu kekinian dengan harga terjangkau..."></textarea>
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Jam Operasional</label>
        <input name="openingHours" value={form.openingHours} onChange={handleChange} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm hover:border-indigo-300" placeholder="Cth: 08:00 - 17:00" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Nomor Admin (Opsional)</label>
        <input name="adminPhone" value={form.adminPhone} onChange={handleChange} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm hover:border-indigo-300" placeholder="Cth: 08123456789" />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Alamat Lengkap</label>
        <input name="address" value={form.address} onChange={handleChange} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm hover:border-indigo-300" placeholder="Cth: Jl. Sudirman No. 1, Jakarta" />
      </div>

      <div className="md:col-span-2 mt-4">
        <details className="group border border-slate-200 rounded-2xl bg-slate-50/50 shadow-sm overflow-hidden transition-all duration-300">
          <summary className="flex justify-between items-center font-bold cursor-pointer list-none p-4 text-slate-700 hover:bg-slate-100/50 transition-colors">
            <span className="flex items-center gap-2">Tampilkan Pengaturan Lanjutan <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">Opsional</span></span>
            <span className="transition-transform duration-300 group-open:rotate-180 bg-white p-1 rounded-full shadow-sm">
              <svg fill="none" height="20" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20"><path d="M6 9l6 6 6-6"></path></svg>
            </span>
          </summary>
          <div className="p-5 pt-2 border-t border-slate-200/60 grid grid-cols-1 md:grid-cols-2 gap-5 bg-white/50">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Ringkasan Produk/Layanan</label>
              <textarea name="productsOrServices" value={form.productsOrServices || ''} onChange={handleChange} rows={2} className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-sm resize-none" placeholder="Detail produk/layanan yang disediakan..."></textarea>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Informasi Harga Standar</label>
              <textarea name="pricingInfo" value={form.pricingInfo || ''} onChange={handleChange} rows={2} className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-sm resize-none" placeholder="Cth: Mulai dari Rp10.000..."></textarea>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Metode Pembayaran</label>
              <input name="paymentMethods" value={form.paymentMethods || ''} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-sm" placeholder="Cth: Transfer BCA, COD" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Metode Pengiriman</label>
              <input name="deliveryMethods" value={form.deliveryMethods || ''} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-sm" placeholder="Cth: Gojek, JNE, Kurir Toko" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Area Layanan</label>
              <input name="serviceArea" value={form.serviceArea || ''} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-sm" placeholder="Cth: Jakarta & Sekitarnya" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Link Google Maps</label>
              <input name="mapsUrl" value={form.mapsUrl || ''} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-sm" placeholder="Cth: https://maps.app.goo.gl/..." />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Link Katalog Utama (PDF/Website)</label>
              <input name="catalogUrl" value={form.catalogUrl || ''} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-sm" placeholder="Cth: https://docs.google.com/..." />
            </div>
          </div>
        </details>
      </div>
    </div>
  </section>
);

export const AIStyleForm = ({ form, handleChange, activeModelDisplay }: any) => (
  <section className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 hover:shadow-xl hover:shadow-purple-100/50 transition-all duration-500 relative overflow-hidden group">
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-100/50 to-transparent rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110"></div>
    <div className="absolute top-0 right-0 p-6 z-10">
       <span className="text-5xl font-black text-slate-100 drop-shadow-sm">2</span>
    </div>
    <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-6 flex items-center gap-3 relative z-10">
      <div className="p-2.5 bg-purple-50 rounded-xl">
        <Bot className="w-6 h-6 text-purple-600" />
      </div>
      Step 2: Pengaturan Gaya AI
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Nama Bot <span className="text-red-500">*</span></label>
        <input name="botName" value={form.botName} onChange={handleChange} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all shadow-sm hover:border-purple-300" placeholder="Cth: Anya CS" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Gaya Bahasa AI</label>
        <select name="toneStyle" value={form.toneStyle} onChange={handleChange} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all shadow-sm hover:border-purple-300 font-medium text-slate-700 appearance-none cursor-pointer">
          <option value="Profesional">👔 Profesional & Formal</option>
          <option value="Ramah">😊 Ramah & Hangat</option>
          <option value="Santai">😎 Santai & Gaul (Gue/Lo)</option>
          <option value="Sales / Soft Selling">🔥 Sales / Persuasif</option>
        </select>
      </div>
      
      <div className="md:col-span-2 flex flex-col gap-3 mt-2">
        <label className="block text-sm font-semibold text-slate-700 ml-1">Karakteristik & Perilaku Bot</label>
        
        <label className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:bg-purple-50/50 hover:border-purple-200 transition-all shadow-sm group">
          <div className="relative flex items-center justify-center w-6 h-6">
            <input type="checkbox" name="useEmoji" checked={form.useEmoji} onChange={handleChange} className="peer w-6 h-6 text-purple-600 bg-slate-100 border-slate-300 rounded focus:ring-purple-500 cursor-pointer transition-all" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-bold text-slate-800 group-hover:text-purple-700 transition-colors">Gunakan Emoji Secara Natural 🚀</span>
            <p className="text-xs text-slate-500 mt-0.5">AI akan menggunakan emoji untuk membuat percakapan lebih hidup dan bersahabat.</p>
          </div>
        </label>
        
        <label className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:bg-emerald-50/50 hover:border-emerald-200 transition-all shadow-sm group">
          <div className="relative flex items-center justify-center w-6 h-6">
            <input type="checkbox" name="allowSelling" checked={form.allowSelling} onChange={handleChange} className="peer w-6 h-6 text-emerald-600 bg-slate-100 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer transition-all" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">Izinkan AI Berjualan & Terima Order 🛍️</span>
            <p className="text-xs text-slate-500 mt-0.5">Jika aktif, AI boleh mengarahkan customer untuk bertransaksi. Jika mati, AI hanya memberi info.</p>
          </div>
        </label>
        
        <label className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:bg-pink-50/50 hover:border-pink-200 transition-all shadow-sm group">
          <div className="relative flex items-center justify-center w-6 h-6">
            <input type="checkbox" name="allowPromoOffer" checked={form.allowPromoOffer} onChange={handleChange} className="peer w-6 h-6 text-pink-500 bg-slate-100 border-slate-300 rounded focus:ring-pink-500 cursor-pointer transition-all" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-bold text-slate-800 group-hover:text-pink-700 transition-colors">Izinkan AI Menawarkan Promo 🎁</span>
            <p className="text-xs text-slate-500 mt-0.5">AI boleh proaktif menawarkan promo atau diskon (pastikan data promo ada di Knowledge Base).</p>
          </div>
        </label>
        
        <label className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:bg-blue-50/50 hover:border-blue-200 transition-all shadow-sm group">
          <div className="relative flex items-center justify-center w-6 h-6">
            <input type="checkbox" name="allowVision" checked={form.allowVision} onChange={handleChange} className="peer w-6 h-6 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 cursor-pointer transition-all" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors">Izinkan Bot Membaca Gambar (AI Vision) 👁️</span>
            <p className="text-xs text-slate-500 mt-0.5">AI akan melihat dan membalas berdasarkan foto yang dikirim. Peringatan: Menggunakan lebih banyak token AI.</p>
          </div>
        </label>
      </div>
      
      <div className="md:col-span-2 mt-4 p-6 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div>
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-amber-400" /> Mesin AI Aktif</h3>
          <p className="text-xs text-slate-400 mt-1">Ditenagai oleh arsitektur LLM tingkat lanjut. Terkoneksi secara terpusat.</p>
        </div>
        <div className="px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-sm font-black text-white shadow-inner flex items-center gap-3 tracking-wide">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          {activeModelDisplay}
        </div>
      </div>
    </div>
  </section>
);

// Sparkles Icon helper
const SparklesIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    <path d="M20 3v4" />
    <path d="M22 5h-4" />
    <path d="M4 17v2" />
    <path d="M5 18H3" />
  </svg>
);

export const WhatsAppConnectionCard = ({ wahaStatus, isComplete }: any) => (
  <section className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 hover:shadow-xl hover:shadow-emerald-100/50 transition-all duration-500 relative overflow-hidden group">
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-100/50 to-transparent rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110"></div>
    <div className="absolute top-0 right-0 p-6 z-10">
      {isComplete ? <CheckCircle2 className="w-10 h-10 text-emerald-400 drop-shadow-md" /> : <span className="text-5xl font-black text-slate-100 drop-shadow-sm">4</span>}
    </div>
    <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 mb-6 flex items-center gap-3 relative z-10">
      <div className="p-2.5 bg-emerald-50 rounded-xl">
        <Key className="w-6 h-6 text-emerald-600" />
      </div>
      Hubungkan WhatsApp
    </h2>
    <div className="space-y-5 relative z-10">
      <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="relative flex h-3 w-3">
          {wahaStatus === 'connected' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
          <span className={`relative inline-flex rounded-full h-3 w-3 ${wahaStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
        </div>
        <p className="text-sm font-semibold text-slate-700">Status WhatsApp Anda saat ini: <span className={`font-bold ${wahaStatus === 'connected' ? 'text-emerald-600' : 'text-amber-600 capitalize'}`}>{wahaStatus}</span></p>
      </div>
      <Link href="/dashboard/waha" className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/30 transform hover:-translate-y-0.5">
        Kelola Koneksi WhatsApp
      </Link>
    </div>
  </section>
);

export const AdvancedRulesPanel = ({ form, handleChange }: any) => (
  <section className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 hover:shadow-xl hover:shadow-amber-100/50 transition-all duration-500 relative overflow-hidden group">
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-100/50 to-transparent rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110"></div>
    <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500 mb-6 flex items-center gap-3 relative z-10">
      <div className="p-2.5 bg-amber-50 rounded-xl">
        <ShieldAlert className="w-6 h-6 text-amber-500" />
      </div>
      Aturan Lanjutan & Fallback
    </h2>
    <div className="space-y-5 relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div><label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Batas Memori Pesan Terakhir (Baris)</label><input type="number" min="2" max="50" name="historyMessageCount" value={form.historyMessageCount || 6} onChange={handleChange} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all shadow-sm" /></div>
        <div><label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Batas Baca Knowledge Base (Karakter)</label><input type="number" min="1000" max="20000" step="500" name="knowledgeCharLimit" value={form.knowledgeCharLimit || 3500} onChange={handleChange} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all shadow-sm" /></div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Webhook URL Aksi Dinamis (Fungsi Eksternal / N8N)</label>
        <p className="text-xs text-slate-500 mb-2 ml-1">Berikan kemampuan AI untuk memanggil URL ini (POST JSON) saat pelanggan membutuhkan aksi spesifik (contoh: cek stok). AI akan menunggu hasil dari URL ini untuk membalas pelanggan.</p>
        <input type="url" name="actionWebhookUrl" value={form.actionWebhookUrl || ''} onChange={handleChange} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all shadow-sm" placeholder="https://hook.n8n.com/..." />
      </div>
      <div><label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Fallback Message (Bila bot tidak tahu)</label><textarea name="fallbackMessage" value={form.fallbackMessage} onChange={handleChange} rows={2} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all shadow-sm hover:border-amber-300 resize-none"></textarea></div>
      <div><label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Pesan Handover (Saat diteruskan ke Admin)</label><textarea name="handoverMessage" value={form.handoverMessage} onChange={handleChange} rows={2} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all shadow-sm hover:border-amber-300 resize-none"></textarea></div>
      <div><label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Keyword Handover (Dipisah koma)</label><input name="handoverKeywords" value={form.handoverKeywords} onChange={handleChange} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all shadow-sm hover:border-amber-300" placeholder="cth: admin, manusia, cs" /></div>
    </div>
  </section>
);

export const AiIntegrationPanel = ({ form, handleChange }: any) => (
  <section className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-500 relative overflow-hidden group mt-8">
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100/50 to-transparent rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110"></div>
    <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-6 flex items-center gap-3 relative z-10">
      <div className="p-2.5 bg-blue-50 rounded-xl">
        <Bot className="w-6 h-6 text-blue-600" />
      </div>
      Integrasi AI & API Key
    </h2>
    <div className="space-y-5 relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">AI Provider</label>
          <select name="aiProvider" value={form.aiProvider} onChange={handleChange} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm cursor-pointer">
            <option value="Flaz Cloud">Flaz Cloud (Recommended)</option>
            <option value="OpenAI">OpenAI</option>
            <option value="Anthropic">Anthropic</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Custom API Key</label>
          <input type="password" name="aiApiKey" value={form.aiApiKey} onChange={handleChange} placeholder="sk-..." className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm" />
          <p className="text-xs text-slate-500 mt-2 ml-1">Kosongkan jika ingin menggunakan Global API Key dari sistem.</p>
        </div>
      </div>
    </div>
  </section>
);

export const ChatbotPreview = ({ chatLogs }: any) => (
  <section className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 relative overflow-hidden mt-8">
    <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-slate-900 mb-6 flex items-center gap-3 relative z-10">
      <div className="p-2.5 bg-slate-100 rounded-xl">
        <MessageSquare className="w-6 h-6 text-slate-600" />
      </div>
      Chat Logs (5 Terakhir)
    </h2>
    <div className="space-y-4 relative z-10">
      {chatLogs.length === 0 ? (
        <div className="text-center py-10 text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">Belum ada percakapan terbaru.</div>
      ) : chatLogs.map((log: any) => (
        <div key={log.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm hover:bg-slate-100 transition-colors">
          <div className="flex justify-between text-xs text-slate-500 mb-2">
            <span className="font-bold text-slate-700">Dari: {log.customerPhone}</span>
            <span>{new Date(log.createdAt).toLocaleString()}</span>
          </div>
          <p className="mb-2"><span className="font-semibold text-blue-600">User:</span> {log.messageIn}</p>
          <div className="pl-4 border-l-2 border-emerald-400 bg-white p-2 rounded-lg shadow-sm">
            <span className="font-semibold text-emerald-600">AI:</span> {log.messageOut}
            {log.messageOut?.includes('[SEND_IMAGE') || log.promptSource?.includes('SEND_IMAGE') ? (
              <div className="mt-2 text-xs font-bold text-emerald-500 bg-emerald-50 p-2 rounded border border-emerald-100">
                📸 [Media Gambar Terdeteksi & Dikirim ke WhatsApp]
              </div>
            ) : null}
          </div>
        </div>
      ))}
      <Link href="/dashboard/chat-logs" className="block text-center mt-6 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
        Lihat Semua Logs →
      </Link>
    </div>
  </section>
);
