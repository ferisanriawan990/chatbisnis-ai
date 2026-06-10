import React from 'react';
import { CheckCircle2, Database, Bot, MessageSquare, Key, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

/* eslint-disable @typescript-eslint/no-explicit-any */

export const BusinessProfileForm = ({ form, handleChange, isComplete }: any) => (
  <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
    <div className="absolute top-0 right-0 p-4">
      {isComplete ? <CheckCircle2 className="w-8 h-8 text-emerald-400 opacity-20" /> : <span className="text-4xl font-black text-slate-100">1</span>}
    </div>
    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 relative z-10">
      <Database className="w-5 h-5 text-indigo-500" /> Step 1: Profil Bisnis
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
      <div><label className="block text-sm font-medium text-slate-700 mb-1">Nama Bisnis *</label><input name="businessName" value={form.businessName} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Cth: Warung Kopi Mantap" /></div>
      <div><label className="block text-sm font-medium text-slate-700 mb-1">Bidang Usaha *</label><input name="businessIndustry" value={form.businessIndustry} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Cth: F&B / Restoran" /></div>
      <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi Singkat (Diberitahukan ke AI) *</label><textarea name="businessDescription" value={form.businessDescription} onChange={handleChange} rows={3} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Cth: Kami menjual kopi susu kekinian dengan harga terjangkau..."></textarea></div>
      <div><label className="block text-sm font-medium text-slate-700 mb-1">Jam Operasional</label><input name="openingHours" value={form.openingHours} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" /></div>
      <div><label className="block text-sm font-medium text-slate-700 mb-1">Nomor Admin (Opsional)</label><input name="adminPhone" value={form.adminPhone} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" /></div>
      <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Alamat Lengkap</label><input name="address" value={form.address} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" /></div>

      <div className="md:col-span-2 mt-2">
        <details className="group border border-slate-200 rounded-lg bg-slate-50">
          <summary className="flex justify-between items-center font-medium cursor-pointer list-none p-3 text-slate-700">
            <span>Tampilkan Pengaturan Lanjutan (Katalog, Area, dll)</span>
            <span className="transition group-open:rotate-180">
              <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
            </span>
          </summary>
          <div className="p-4 pt-0 border-t border-slate-200 mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Produk atau Layanan</label><textarea name="productsOrServices" value={form.productsOrServices || ''} onChange={handleChange} rows={2} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none" placeholder="Detail produk/layanan yang disediakan..."></textarea></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Informasi Harga</label><textarea name="pricingInfo" value={form.pricingInfo || ''} onChange={handleChange} rows={2} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none" placeholder="Cth: Mulai dari Rp10.000..."></textarea></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Metode Pembayaran</label><input name="paymentMethods" value={form.paymentMethods || ''} onChange={handleChange} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none" placeholder="Cth: Transfer BCA, COD" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Metode Pengiriman</label><input name="deliveryMethods" value={form.deliveryMethods || ''} onChange={handleChange} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none" placeholder="Cth: Gojek, JNE, Kurir Toko" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Area Layanan</label><input name="serviceArea" value={form.serviceArea || ''} onChange={handleChange} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none" placeholder="Cth: Jakarta & Sekitarnya" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Link Google Maps</label><input name="mapsUrl" value={form.mapsUrl || ''} onChange={handleChange} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none" placeholder="Cth: https://maps.app.goo.gl/..." /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Link Katalog (PDF/Google Drive/Sheet)</label><input name="catalogUrl" value={form.catalogUrl || ''} onChange={handleChange} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none" placeholder="Cth: https://docs.google.com/..." /></div>
          </div>
        </details>
      </div>
    </div>
  </section>
);

export const AIStyleForm = ({ form, handleChange, activeModelDisplay }: any) => (
  <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
    <div className="absolute top-0 right-0 p-4">
       <span className="text-4xl font-black text-slate-100">2</span>
    </div>
    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 relative z-10">
      <Bot className="w-5 h-5 text-purple-500" /> Step 2: Pengaturan Gaya AI
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
      <div><label className="block text-sm font-medium text-slate-700 mb-1">Nama Bot</label><input name="botName" value={form.botName} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" /></div>
      <div><label className="block text-sm font-medium text-slate-700 mb-1">Gaya Bahasa</label>
        <select name="toneStyle" value={form.toneStyle} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none">
          <option value="Profesional">Profesional</option><option value="Ramah">Ramah</option><option value="Santai">Santai</option><option value="Sales / Soft Selling">Sales / Soft Selling</option>
        </select>
      </div>
      <div className="flex flex-col gap-2 mt-2">
        <label className="block text-sm font-semibold text-slate-700 ml-1">Karakteristik Balasan</label>
        <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
          <input type="checkbox" name="useEmoji" checked={form.useEmoji} onChange={handleChange} className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer" />
          <span className="text-sm font-medium text-slate-700">Gunakan Emoji 😊🚀</span>
        </label>
        <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
          <input type="checkbox" name="allowSelling" checked={form.allowSelling} onChange={handleChange} className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer" />
          <span className="text-sm font-medium text-slate-700">Izinkan AI Jualan/Terima Order</span>
        </label>
        <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
          <input type="checkbox" name="allowPromoOffer" checked={form.allowPromoOffer} onChange={handleChange} className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer" />
          <span className="text-sm font-medium text-slate-700">Izinkan AI Tawarkan Promo/Diskon</span>
        </label>
      </div>
      <div className="md:col-span-2 mt-4 p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100/50 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-purple-900">Model AI Aktif</h3>
          <p className="text-xs text-purple-700 mt-1">Model bahasa ini dikelola secara terpusat oleh sistem.</p>
        </div>
        <div className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-purple-200 rounded-xl text-sm font-extrabold text-purple-700 shadow-sm flex items-center gap-2">
          {activeModelDisplay}
          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded-full uppercase tracking-wider">Locked</span>
        </div>
      </div>
    </div>
  </section>
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
      <div><label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Fallback Message (Bila bot tidak tahu)</label><textarea name="fallbackMessage" value={form.fallbackMessage} onChange={handleChange} rows={2} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all shadow-sm hover:border-amber-300 resize-none"></textarea></div>
      <div><label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Pesan Handover (Saat diteruskan ke Admin)</label><textarea name="handoverMessage" value={form.handoverMessage} onChange={handleChange} rows={2} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all shadow-sm hover:border-amber-300 resize-none"></textarea></div>
      <div><label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Keyword Handover (Dipisah koma)</label><input name="handoverKeywords" value={form.handoverKeywords} onChange={handleChange} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all shadow-sm hover:border-amber-300" placeholder="cth: admin, manusia, cs" /></div>
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
          <p className="pl-4 border-l-2 border-emerald-400 bg-white p-2 rounded-lg shadow-sm"><span className="font-semibold text-emerald-600">AI:</span> {log.messageOut}</p>
        </div>
      ))}
      <Link href="/dashboard/chat-logs" className="block text-center mt-6 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
        Lihat Semua Logs →
      </Link>
    </div>
  </section>
);
