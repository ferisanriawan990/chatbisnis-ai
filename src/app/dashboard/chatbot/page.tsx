'use client';

import { useState, useEffect } from 'react';
import { Bot, Save, Power, PowerOff, FileSpreadsheet, UploadCloud, Database, ShieldAlert, Key, MessageSquare, Users, Download } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function ChatbotDashboard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<any>(null);

  // Form State
  const [form, setForm] = useState({
    businessName: '',
    businessIndustry: '',
    businessDescription: '',
    address: '',
    openingHours: '',
    adminPhone: '',
    websiteUrl: '',
    instagramUrl: '',
    botName: '',
    toneStyle: 'Profesional',
    language: 'id',
    useEmoji: true,
    maxReplyLength: 'sedang',
    allowSelling: true,
    allowPromoOffer: true,
    fallbackMessage: '',
    handoverMessage: '',
    handoverKeywords: '',
    outOfHoursMessage: '',
    aiProvider: 'Flaz Cloud',
    aiModel: 'claude-haiku-4-5',
    aiApiKey: '',
    dailyChatLimit: 1000,
    monthlyChatLimit: 30000,
    wahaBaseUrl: '',
    wahaApiKey: '',
    wahaSessionName: 'default',
    isActive: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dashboard/chatbot');
      const json = await res.json();
      if (json.businessProfile && json.chatbotSetting) {
        setData(json);
        setForm({
          ...json.businessProfile,
          ...json.chatbotSetting,
          aiApiKey: json.chatbotSetting.aiApiKeyEncrypted ? '******' : '',
          wahaApiKey: json.chatbotSetting.wahaApiKeyEncrypted ? '******' : '',
        });
      }
    } catch (error) {
      toast.error('Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/dashboard/chatbot/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success('Pengaturan berhasil disimpan!');
      } else {
        toast.error('Gagal menyimpan pengaturan');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleToggle = async () => {
    // API request to toggle bot
    setForm(prev => ({ ...prev, isActive: !prev.isActive }));
    toast.success(!form.isActive ? 'Bot diaktifkan' : 'Bot dimatikan');
  };

  if (loading) return <div className="flex items-center justify-center h-full"><span className="animate-pulse text-blue-600 font-medium">Memuat data...</span></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <Toaster position="top-right" />
      
      {/* Header & Status Bot */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Bot className="w-8 h-8 text-blue-600" />
            Pengaturan Chatbot AI
          </h1>
          <p className="text-slate-500 mt-1">Kelola asisten virtual WhatsApp untuk bisnis Anda.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleToggle}
            className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all ${form.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
          >
            {form.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
            {form.isActive ? 'Matikan Bot' : 'Aktifkan Bot'}
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center gap-2 transition-all shadow-md shadow-blue-200 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Menyimpan...' : 'Simpan Semua'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="bg-blue-50 p-3 rounded-lg"><MessageSquare className="w-6 h-6 text-blue-600" /></div>
           <div><p className="text-sm text-slate-500">Total Chat Hari Ini</p><p className="text-xl font-bold">124</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="bg-emerald-50 p-3 rounded-lg"><Users className="w-6 h-6 text-emerald-600" /></div>
           <div><p className="text-sm text-slate-500">Jumlah Lead Baru</p><p className="text-xl font-bold">18</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="bg-amber-50 p-3 rounded-lg"><ShieldAlert className="w-6 h-6 text-amber-600" /></div>
           <div><p className="text-sm text-slate-500">Butuh Bantuan Admin</p><p className="text-xl font-bold text-amber-600">3</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="bg-purple-50 p-3 rounded-lg"><Bot className="w-6 h-6 text-purple-600" /></div>
           <div><p className="text-sm text-slate-500">WAHA Status</p><p className="text-xl font-bold text-emerald-600">Connected</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Business Profile */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-500" />
              Profil Bisnis
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Bisnis</label>
                <input name="businessName" value={form.businessName} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bidang Usaha</label>
                <input name="businessIndustry" value={form.businessIndustry} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi Singkat (Diberitahukan ke AI)</label>
                <textarea name="businessDescription" value={form.businessDescription} onChange={handleChange} rows={3} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"></textarea>
              </div>
            </div>
          </section>

          {/* AI Settings */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-500" />
              Pengaturan Gaya AI
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Bot</label>
                <input name="botName" value={form.botName} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gaya Bahasa</label>
                <select name="toneStyle" value={form.toneStyle} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all">
                  <option>Profesional</option>
                  <option>Ramah</option>
                  <option>Santai</option>
                  <option>Sales / Soft Selling</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="useEmoji" checked={form.useEmoji} onChange={handleChange} className="w-4 h-4 text-purple-600 rounded" />
                  <span className="text-sm font-medium text-slate-700">Gunakan Emoji</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="allowSelling" checked={form.allowSelling} onChange={handleChange} className="w-4 h-4 text-purple-600 rounded" />
                  <span className="text-sm font-medium text-slate-700">Izinkan Menawarkan Produk/Promo</span>
                </label>
              </div>
            </div>
          </section>

          {/* Data AI / Knowledge Base */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-500" />
                Data AI / Knowledge Base
              </h2>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
                <Download className="w-4 h-4" /> Template Excel
              </button>
            </div>
            <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer mb-6">
              <UploadCloud className="w-10 h-10 text-blue-500 mx-auto mb-2" />
              <p className="font-medium text-slate-700">Upload Data Knowledge</p>
              <p className="text-sm text-slate-500 mt-1">Excel, CSV, PDF, atau DOCX (Max 10MB)</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Nama File / Sumber</th>
                    <th className="px-4 py-3">Tipe</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 rounded-tr-lg text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium">Katalog_Produk_2026.xlsx</td>
                    <td className="px-4 py-3"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Excel</span></td>
                    <td className="px-4 py-3"><span className="flex items-center gap-1 text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active</span></td>
                    <td className="px-4 py-3 text-right"><button className="text-red-500 hover:underline">Hapus</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Chat Logs */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-500" />
              Chat Logs & Leads
            </h2>
            <div className="text-center py-8 text-slate-500 border border-slate-100 rounded-xl bg-slate-50">
              Belum ada riwayat percakapan.
            </div>
          </section>

        </div>

        {/* Right Column */}
        <div className="space-y-8">
          
          {/* Bot Rules */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              Aturan & Fallback
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fallback Message</label>
                <textarea name="fallbackMessage" value={form.fallbackMessage} onChange={handleChange} rows={2} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Handover Message</label>
                <textarea name="handoverMessage" value={form.handoverMessage} onChange={handleChange} rows={2} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"></textarea>
              </div>
            </div>
          </section>

          {/* Integrations */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-emerald-500" />
              Koneksi & API
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">WAHA Base URL</label>
                <input name="wahaBaseUrl" value={form.wahaBaseUrl} onChange={handleChange} placeholder="https://waha.example.com" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">WAHA API Key</label>
                <input type="password" name="wahaApiKey" value={form.wahaApiKey} onChange={handleChange} placeholder="Rahasia..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" />
              </div>
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-sm font-medium text-slate-700 mb-1">Flaz Cloud AI Key</label>
                <input type="password" name="aiApiKey" value={form.aiApiKey} onChange={handleChange} placeholder="sk-..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" />
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
