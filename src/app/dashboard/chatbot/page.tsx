'use client';

import { useState, useEffect, useRef } from 'react';
import { Bot, Save, Power, PowerOff, UploadCloud, Database, ShieldAlert, Key, MessageSquare, Users, Download, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image';

export default function ChatbotDashboard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [analytics, setAnalytics] = useState({ todayChats: 0, monthlyChats: 0, newLeads: 0, needsHuman: 0 });
  const [knowledgeSources, setKnowledgeSources] = useState<any[]>([]);
  const [chatLogs, setChatLogs] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [wahaStatus, setWahaStatus] = useState('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);

  const [form, setForm] = useState({
    businessName: '', businessIndustry: '', businessDescription: '', address: '', openingHours: '', adminPhone: '', websiteUrl: '', instagramUrl: '', marketplaceUrl: '',
    botName: '', toneStyle: 'Profesional', language: 'id', useEmoji: true, maxReplyLength: 'sedang', allowSelling: true, allowPromoOffer: true,
    fallbackMessage: '', handoverMessage: '', handoverKeywords: '', outOfHoursMessage: '',
    aiProvider: 'Flaz Cloud', aiModel: 'claude-haiku-4-5', aiApiKey: '',
    dailyChatLimit: 1000, monthlyChatLimit: 30000,
    wahaBaseUrl: '', wahaApiKey: '', wahaSessionName: '',
    isActive: false,
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [chatbotRes, analyticsRes, knowledgeRes, logsRes, leadsRes, wahaStatusRes] = await Promise.all([
        fetch('/api/dashboard/chatbot'),
        fetch('/api/dashboard/analytics'),
        fetch('/api/dashboard/knowledge'),
        fetch('/api/dashboard/chat-logs?limit=5'),
        fetch('/api/dashboard/leads?limit=5'),
        fetch('/api/dashboard/waha/status'),
      ]);

      if (chatbotRes.ok) {
        const json = await chatbotRes.json();
        if (json.businessProfile && json.chatbotSetting) {
          setForm({
            ...json.businessProfile,
            ...json.chatbotSetting,
            aiApiKey: json.chatbotSetting.aiApiKeyEncrypted ? '••••••••' : '',
            wahaApiKey: json.chatbotSetting.wahaApiKeyEncrypted ? '••••••••' : '',
          });
        }
      }

      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (knowledgeRes.ok) setKnowledgeSources((await knowledgeRes.json()).sources || []);
      if (logsRes.ok) setChatLogs((await logsRes.json()).logs || []);
      if (leadsRes.ok) setLeads((await leadsRes.json()).leads || []);
      
      if (wahaStatusRes.ok) {
        const { status } = await wahaStatusRes.json();
        setWahaStatus(status);
        if (status === 'qr') {
          fetchQrCode();
        }
      }
    } catch (error) {
      toast.error('Gagal mengambil sebagian data');
    } finally {
      setLoading(false);
    }
  };

  const fetchQrCode = async () => {
    const res = await fetch('/api/dashboard/waha/qr');
    if (res.ok) {
      const { qr } = await res.json();
      setQrCode(qr);
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
        const err = await res.json();
        toast.error(err.error || 'Gagal menyimpan pengaturan');
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
  };

  const handleToggle = async () => {
    try {
      const res = await fetch('/api/dashboard/chatbot/toggle', { method: 'POST' });
      if (res.ok) {
        const { isActive } = await res.json();
        setForm(prev => ({ ...prev, isActive }));
        toast.success(isActive ? 'Bot diaktifkan' : 'Bot dimatikan');
      }
    } catch {
      toast.error('Gagal mengubah status bot');
    }
  };

  const handleWahaStart = async () => {
    toast.loading('Memulai sesi WAHA...', { id: 'waha' });
    try {
      const res = await fetch('/api/dashboard/waha/start', { method: 'POST' });
      if (res.ok) {
        toast.success('Perintah mulai dikirim!', { id: 'waha' });
        setTimeout(() => {
          fetch('/api/dashboard/waha/status').then(r => r.json()).then(d => {
            setWahaStatus(d.status);
            if (d.status === 'qr') fetchQrCode();
          });
        }, 3000);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Gagal memulai WAHA', { id: 'waha' });
      }
    } catch {
      toast.error('Jaringan bermasalah', { id: 'waha' });
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    toast.loading('Mengupload file...', { id: 'upload' });
    try {
      const res = await fetch('/api/dashboard/knowledge/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        toast.success('Data berhasil diupload', { id: 'upload' });
        const { source } = await res.json();
        setKnowledgeSources(prev => [source, ...prev]);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Gagal upload', { id: 'upload' });
      }
    } catch {
      toast.error('Jaringan bermasalah', { id: 'upload' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteKnowledge = async (id: string) => {
    if (!confirm('Yakin ingin menghapus sumber data ini beserta isinya?')) return;
    try {
      const res = await fetch(`/api/dashboard/knowledge/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setKnowledgeSources(prev => prev.filter(s => s.id !== id));
        toast.success('Data dihapus');
      }
    } catch {
      toast.error('Gagal menghapus');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><span className="animate-pulse text-blue-600 font-medium">Memuat data dashboard...</span></div>;

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
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleToggle} className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all ${form.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
            {form.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
            {form.isActive ? 'Matikan Bot' : 'Aktifkan Bot'}
          </button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center gap-2 transition-all shadow-md shadow-blue-200 disabled:opacity-50">
            <Save className="w-4 h-4" />
            {saving ? 'Menyimpan...' : 'Simpan Semua'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="bg-blue-50 p-3 rounded-lg"><MessageSquare className="w-6 h-6 text-blue-600" /></div>
           <div><p className="text-sm text-slate-500">Chat Hari Ini</p><p className="text-xl font-bold">{analytics.todayChats}</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="bg-emerald-50 p-3 rounded-lg"><Users className="w-6 h-6 text-emerald-600" /></div>
           <div><p className="text-sm text-slate-500">Lead Baru (7H)</p><p className="text-xl font-bold">{analytics.newLeads}</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="bg-amber-50 p-3 rounded-lg"><ShieldAlert className="w-6 h-6 text-amber-600" /></div>
           <div><p className="text-sm text-slate-500">Butuh Admin</p><p className="text-xl font-bold text-amber-600">{analytics.needsHuman}</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="bg-purple-50 p-3 rounded-lg"><Bot className="w-6 h-6 text-purple-600" /></div>
           <div>
            <p className="text-sm text-slate-500">Status WAHA</p>
            <p className={`text-xl font-bold ${wahaStatus === 'connected' ? 'text-emerald-600' : 'text-amber-600 capitalize'}`}>{wahaStatus}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-500" /> Profil Bisnis
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Nama Bisnis</label><input name="businessName" value={form.businessName} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Bidang Usaha</label><input name="businessIndustry" value={form.businessIndustry} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi Singkat (Diberitahukan ke AI)</label><textarea name="businessDescription" value={form.businessDescription} onChange={handleChange} rows={3} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"></textarea></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Jam Operasional</label><input name="openingHours" value={form.openingHours} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Nomor Admin (Opsional)</label><input name="adminPhone" value={form.adminPhone} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" /></div>
              <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label><input name="address" value={form.address} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" /></div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-500" /> Pengaturan Gaya AI
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Nama Bot</label><input name="botName" value={form.botName} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Gaya Bahasa</label>
                <select name="toneStyle" value={form.toneStyle} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none">
                  <option value="Profesional">Profesional</option><option value="Ramah">Ramah</option><option value="Santai">Santai</option><option value="Sales / Soft Selling">Sales / Soft Selling</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="useEmoji" checked={form.useEmoji} onChange={handleChange} className="w-4 h-4 text-purple-600 rounded" /><span className="text-sm font-medium text-slate-700">Gunakan Emoji</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="allowSelling" checked={form.allowSelling} onChange={handleChange} className="w-4 h-4 text-purple-600 rounded" /><span className="text-sm font-medium text-slate-700">Izinkan Promo</span></label>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Database className="w-5 h-5 text-blue-500" /> Knowledge Base</h2>
              <a href="/api/dashboard/knowledge/template" className="text-sm text-blue-600 hover:text-blue-700 font-medium bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
                <Download className="w-4 h-4" /> Template Excel
              </a>
            </div>
            
            <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls,.csv,.pdf,.docx" onChange={handleUpload} disabled={uploading} />
            <div onClick={() => fileInputRef.current?.click()} className="border border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer mb-6">
              <UploadCloud className={`w-10 h-10 text-blue-500 mx-auto mb-2 ${uploading ? 'animate-bounce' : ''}`} />
              <p className="font-medium text-slate-700">{uploading ? 'Memproses...' : 'Upload Data Knowledge'}</p>
              <p className="text-sm text-slate-500 mt-1">Excel, CSV, PDF, atau DOCX (Max 10MB)</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Nama / Sumber</th>
                    <th className="px-4 py-3">Tipe</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3 rounded-tr-lg text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {knowledgeSources.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-4 text-slate-400">Belum ada data knowledge</td></tr>
                  ) : (
                    knowledgeSources.map(s => (
                      <tr key={s.id} className="border-b border-slate-100">
                        <td className="px-4 py-3 font-medium">{s.title}</td>
                        <td className="px-4 py-3"><span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs uppercase">{s.type}</span></td>
                        <td className="px-4 py-3">{s.itemCount}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleDeleteKnowledge(s.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4 inline" /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-indigo-500" /> Chat Logs (5 Terakhir)</h2>
            <div className="space-y-3">
              {chatLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-500 border border-slate-100 rounded-xl bg-slate-50">Belum ada percakapan.</div>
              ) : chatLogs.map(log => (
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
          </section>

        </div>

        <div className="space-y-8">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-amber-500" /> Aturan & Fallback</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Fallback Message</label><textarea name="fallbackMessage" value={form.fallbackMessage} onChange={handleChange} rows={2} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"></textarea></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Handover Message</label><textarea name="handoverMessage" value={form.handoverMessage} onChange={handleChange} rows={2} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"></textarea></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Handover Keywords (koma)</label><input name="handoverKeywords" value={form.handoverKeywords} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" /></div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Key className="w-5 h-5 text-emerald-500" /> Koneksi API</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">WAHA Base URL</label><input name="wahaBaseUrl" value={form.wahaBaseUrl} onChange={handleChange} placeholder="https://waha.example.com" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">WAHA API Key</label><input type="password" name="wahaApiKey" value={form.wahaApiKey} onChange={handleChange} placeholder="Rahasia..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" /></div>
              
              <div className="pt-2 flex flex-col gap-2">
                <button onClick={handleWahaStart} disabled={wahaStatus === 'connected'} className="w-full px-4 py-2 bg-emerald-100 text-emerald-700 font-medium rounded-lg hover:bg-emerald-200 disabled:opacity-50">Mulai Sesi WAHA</button>
                {wahaStatus === 'qr' && qrCode && (
                  <div className="p-4 border border-slate-200 rounded-lg text-center bg-white mt-2">
                    <p className="text-sm font-bold text-slate-700 mb-2">Scan QR Ini di WhatsApp</p>
                    <Image src={qrCode} alt="WhatsApp QR" width={200} height={200} className="mx-auto" />
                  </div>
                )}
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
