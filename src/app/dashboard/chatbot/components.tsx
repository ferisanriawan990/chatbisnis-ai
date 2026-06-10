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
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="useEmoji" checked={form.useEmoji} onChange={handleChange} className="w-4 h-4 text-purple-600 rounded" /><span className="text-sm font-medium text-slate-700">Gunakan Emoji dalam membalas pesan</span></label>
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="allowSelling" checked={form.allowSelling} onChange={handleChange} className="w-4 h-4 text-purple-600 rounded" /><span className="text-sm font-medium text-slate-700">Izinkan AI menawarkan Promo</span></label>
      </div>
      <div className="md:col-span-2 mt-2 p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-purple-900">Model AI Aktif</h3>
          <p className="text-xs text-purple-700 mt-0.5">Model ini sedang digunakan oleh chatbot Anda.</p>
        </div>
        <div className="px-3 py-1 bg-white border border-purple-200 rounded-lg text-sm font-semibold text-purple-700 shadow-sm">
          {activeModelDisplay}
        </div>
      </div>
    </div>
  </section>
);

export const WhatsAppConnectionCard = ({ wahaStatus, isComplete }: any) => (
  <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
    <div className="absolute top-0 right-0 p-4">
      {isComplete ? <CheckCircle2 className="w-8 h-8 text-emerald-400 opacity-20" /> : <span className="text-4xl font-black text-slate-100">4</span>}
    </div>
    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 relative z-10"><Key className="w-5 h-5 text-emerald-500" /> Step 4: Hubungkan WhatsApp</h2>
    <div className="space-y-4 relative z-10">
      <p className="text-sm text-slate-600">Status WhatsApp Anda saat ini: <span className={`font-bold ${wahaStatus === 'connected' ? 'text-emerald-600' : 'text-amber-600 capitalize'}`}>{wahaStatus}</span></p>
      <Link href="/dashboard/waha" className="inline-block w-full text-center px-4 py-2 bg-emerald-100 text-emerald-700 font-medium rounded-lg hover:bg-emerald-200 transition-colors">
        Kelola Koneksi WhatsApp
      </Link>
    </div>
  </section>
);

export const AdvancedRulesPanel = ({ form, handleChange }: any) => (
  <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-amber-500" /> Aturan Lanjutan & Fallback</h2>
    <div className="space-y-4">
      <div><label className="block text-sm font-medium text-slate-700 mb-1">Fallback Message (Bila bot tidak tahu)</label><textarea name="fallbackMessage" value={form.fallbackMessage} onChange={handleChange} rows={2} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"></textarea></div>
      <div><label className="block text-sm font-medium text-slate-700 mb-1">Pesan Handover (Saat diteruskan ke Admin)</label><textarea name="handoverMessage" value={form.handoverMessage} onChange={handleChange} rows={2} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"></textarea></div>
      <div><label className="block text-sm font-medium text-slate-700 mb-1">Keyword Handover (Dipisah koma)</label><input name="handoverKeywords" value={form.handoverKeywords} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" placeholder="cth: admin, manusia, cs" /></div>
    </div>
  </section>
);

export const ChatbotPreview = ({ chatLogs }: any) => (
  <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 relative z-10"><MessageSquare className="w-5 h-5 text-indigo-500" /> Chat Logs (5 Terakhir)</h2>
    <div className="space-y-3 relative z-10">
      {chatLogs.length === 0 ? (
        <div className="text-center py-8 text-slate-500 border border-slate-100 rounded-xl bg-slate-50">Belum ada percakapan terbaru.</div>
      ) : chatLogs.map((log: any) => (
        <div key={log.id} className="p-3 border border-slate-100 rounded-lg bg-slate-50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-600">{log.customerPhone}</span>
            <span className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
          </div>
          <p className="text-sm"><b>Masuk:</b> {log.messageIn}</p>
          <p className="text-sm mt-1 text-slate-600"><b>Balas:</b> {log.messageOut}</p>
        </div>
      ))}
    </div>
    <div className="mt-4 text-center relative z-10">
      <Link href="/dashboard/chat-logs" className="text-sm text-blue-600 hover:underline">Lihat Semua Logs</Link>
    </div>
  </section>
);
