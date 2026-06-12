/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Trash2, CheckCircle2, AlertCircle, UploadCloud, Download, Database, Bot, Power, PowerOff } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { BusinessProfileForm, AIStyleForm, WhatsAppConnectionCard, AdvancedRulesPanel, ChatbotPreview } from './components';

export default function ChatbotDashboard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [knowledgeSources, setKnowledgeSources] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [chatLogs, setChatLogs] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [wahaStatus, setWahaStatus] = useState('disconnected');
  const [manualForm, setManualForm] = useState({ type: 'qa', question: '', answer: '', productName: '', productCategory: '', price: 0, stockStatus: 'Tersedia', description: '', imageUrl: '' });
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any

  const [form, setForm] = useState({
    businessName: '', businessIndustry: '', businessDescription: '', address: '', openingHours: '', adminPhone: '', websiteUrl: '', instagramUrl: '', marketplaceUrl: '',
    botName: '', toneStyle: 'Profesional', language: 'id', useEmoji: true, maxReplyLength: 'sedang', allowSelling: true, allowPromoOffer: true, allowVision: false,
    fallbackMessage: '', handoverMessage: '', handoverKeywords: '', outOfHoursMessage: '',
    aiProvider: 'Flaz Cloud', aiModel: 'gpt-4o-mini', aiApiKey: '',
    dailyChatLimit: 1000, monthlyChatLimit: 30000,
    historyMessageCount: 6, knowledgeCharLimit: 3500, actionWebhookUrl: '',
    isActive: false,
    templateId: '',
    productsOrServices: '', pricingInfo: '', paymentMethods: '', deliveryMethods: '', serviceArea: '', catalogUrl: '', mapsUrl: '', customFAQ: '',
  });

  const [activeModelDisplay, setActiveModelDisplay] = useState('gpt-4o-mini');

  const fetchInitialData = useCallback(async () => {
    try {
      const [chatbotRes, knowledgeRes, logsRes, wahaStatusRes, templatesRes] = await Promise.all([
        fetch('/api/dashboard/chatbot'),
        fetch('/api/dashboard/knowledge'),
        fetch('/api/dashboard/chat-logs?limit=5'),
        fetch('/api/dashboard/waha/status'),
        fetch('/api/templates'),
      ]);

      if (chatbotRes.ok) {
        const json = await chatbotRes.json();
        if (json.businessProfile && json.chatbotSetting) {
          setForm({
            ...json.businessProfile,
            ...json.chatbotSetting,
            actionWebhookUrl: json.chatbotSetting.actionWebhookUrl || '',
            templateId: json.botConfig?.templateId || '',
            productsOrServices: json.botConfig?.productsOrServices || '',
            pricingInfo: json.botConfig?.pricingInfo || '',
            paymentMethods: json.botConfig?.paymentMethods || '',
            deliveryMethods: json.botConfig?.deliveryMethods || '',
            serviceArea: json.botConfig?.serviceArea || '',
            catalogUrl: json.botConfig?.catalogUrl || '',
            mapsUrl: json.botConfig?.mapsUrl || '',
            customFAQ: json.botConfig?.customFAQ || '',
          });
          
          if (json.hasGlobalKey && json.globalAiModel) {
            setActiveModelDisplay(`${json.globalAiModel} (Global)`);
          } else if (json.chatbotSetting.aiModel) {
            setActiveModelDisplay(json.chatbotSetting.aiModel);
          }
        }
      }

      if (knowledgeRes.ok) setKnowledgeSources((await knowledgeRes.json()).sources || []);
      if (logsRes.ok) setChatLogs((await logsRes.json()).logs || []);
      
      if (wahaStatusRes.ok) {
        const { status } = await wahaStatusRes.json();
        setWahaStatus(status);
      }
      
      if (templatesRes.ok) {
        const data = await templatesRes.json();
        setTemplates(data.templates || []);
      }
    } catch {
      toast.error('Gagal mengambil data chatbot');
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void fetchInitialData(); }, []);

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
      } else {
        const err = await res.json();
        // Show detailed error checklist if provided
        if (err.missing) {
          const missingItems = err.missing.map((m: string) => `• ${m}`).join('\\n');
          toast.error(`Lengkapi setup:\\n${missingItems}`, { duration: 5000 });
        } else {
          toast.error(err.error || 'Gagal mengubah status bot');
        }
      }
    } catch {
      toast.error('Gagal mengubah status bot');
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

  
  const handleManualSubmit = async () => {
    toast.loading('Menyimpan...', { id: 'manual' });
    try {
      const payload: any = { type: manualForm.type }; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (manualForm.type === 'qa') {
        if (!manualForm.question || !manualForm.answer) return toast.error('Q&A harus diisi', { id: 'manual' });
        payload.question = manualForm.question;
        payload.answer = manualForm.answer;
      } else {
        if (!manualForm.productName) return toast.error('Nama produk harus diisi', { id: 'manual' });
        payload.productName = manualForm.productName;
        payload.productCategory = manualForm.productCategory;
        payload.price = Number(manualForm.price);
        payload.stockStatus = manualForm.stockStatus;
        payload.description = manualForm.description;
        payload.imageUrl = manualForm.imageUrl;
      }
      const res = await fetch('/api/dashboard/knowledge/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success('Disimpan!', { id: 'manual' });
        const { source } = await res.json();
        setKnowledgeSources(prev => [source, ...prev]);
        setManualForm({ type: manualForm.type, question: '', answer: '', productName: '', productCategory: '', price: 0, stockStatus: 'Tersedia', description: '', imageUrl: '' });
      } else {
        const err = await res.json();
        toast.error(err.error || 'Gagal menyimpan', { id: 'manual' });
      }
    } catch {
      toast.error('Jaringan bermasalah', { id: 'manual' });
    }
  };

  const handleGoogleSheetSubmit = async () => {
    if (!googleSheetUrl) return toast.error('URL wajib diisi');
    toast.loading('Mengambil data dari Google Sheet...', { id: 'gsheet' });
    try {
      const res = await fetch('/api/dashboard/knowledge/google-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleSheetUrl })
      });
      if (res.ok) {
        toast.success('Berhasil diimport!', { id: 'gsheet' });
        void fetchInitialData(); // Reload knowledge sources
        setGoogleSheetUrl('');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Gagal mengambil data', { id: 'gsheet' });
      }
    } catch {
      toast.error('Jaringan bermasalah', { id: 'gsheet' });
    }
  };

  const handleSyncGoogleSheet = async (sourceId: string, url: string) => {
    setSyncingId(sourceId);
    toast.loading('Sinkronisasi ulang...', { id: 'sync' });
    try {
      const res = await fetch('/api/dashboard/knowledge/google-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, googleSheetUrl: url })
      });
      if (res.ok) {
        toast.success('Berhasil disinkronisasi!', { id: 'sync' });
        void fetchInitialData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Gagal sinkronisasi', { id: 'sync' });
      }
    } catch {
      toast.error('Jaringan bermasalah', { id: 'sync' });
    } finally {
      setSyncingId(null);
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

  if (loading) return <div className="flex items-center justify-center h-full"><span className="animate-pulse text-blue-600 font-medium">Memuat pengaturan...</span></div>;

  const stepsComplete = {
    profile: !!form.businessName,
    knowledge: true, // Knowledge base is now optional
    waha: wahaStatus === 'connected'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50">
      {/* Floating Action Bar (Glassmorphism) */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 z-50 p-4 animate-in slide-in-from-bottom-10 duration-500">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl shadow-indigo-500/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">Status Chatbot: <span className={form.isActive ? 'text-emerald-600' : 'text-slate-500'}>{form.isActive ? 'Aktif & Menjawab' : 'Nonaktif'}</span></p>
              <p className="text-xs text-slate-500">Jangan lupa simpan perubahan sebelum mengaktifkan bot.</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button onClick={handleToggle} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${form.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100'}`}>
                {form.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                {form.isActive ? 'Matikan Bot' : 'Aktifkan Bot'}
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 sm:flex-none px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5">
                <Save className="w-4 h-4" />
                {saving ? 'Menyimpan...' : 'Simpan Semua'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8 pb-32 pt-8 px-4 sm:px-6 animate-in fade-in duration-700">
        <Toaster position="top-right" />
        
        {/* Header & Status Bot */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-lg p-8 rounded-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/20">
                <Bot className="w-8 h-8 text-white" />
              </div>
              Pengaturan Chatbot AI
            </h1>
            <p className="text-slate-500 mt-2 font-medium text-lg ml-14">Desain cerdas, asisten responsif. Sesuaikan profil bisnis Anda.</p>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          <BusinessProfileForm form={form} handleChange={handleChange} isComplete={stepsComplete.profile} />
          
          <AIStyleForm form={form} handleChange={handleChange} activeModelDisplay={activeModelDisplay} />

          <section className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-500 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100/50 to-transparent rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110"></div>
            <div className="absolute top-0 right-0 p-6 z-10">
              {stepsComplete.knowledge ? <CheckCircle2 className="w-10 h-10 text-emerald-400 drop-shadow-md" /> : <span className="text-5xl font-black text-slate-100 drop-shadow-sm">3</span>}
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 relative z-10 gap-3">
              <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-xl">
                  <Database className="w-6 h-6 text-blue-600" />
                </div>
                Step 3: Knowledge Base <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full font-bold ml-2 text-black">Opsional</span>
              </h2>
              <Link href="/api/dashboard/knowledge/template" className="px-4 py-2 bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 rounded-xl flex items-center gap-2 transition-colors border border-blue-100 shadow-sm text-sm">
                <Download className="w-4 h-4" /> Template Excel
              </Link>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100/50 mb-6 relative z-10 shadow-sm">
              <h3 className="font-extrabold text-sm mb-2 text-blue-900">Template Bot Utama</h3>
              <p className="text-xs text-blue-700/80 mb-4 font-medium">Pilih Template Usaha yang akan menjadi dasar pengetahuan AI sebelum membaca Knowledge Base khusus.</p>
              <select name="templateId" value={form.templateId || ''} onChange={handleChange} className="w-full p-3.5 bg-white border border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-semibold text-slate-700 shadow-sm appearance-none cursor-pointer">
                <option value="">-- Pilih Template Usaha --</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10 mb-8">
              {/* Card Upload File */}
              <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-blue-200 flex flex-col items-center justify-center text-center hover:bg-blue-50/50 hover:border-blue-400 transition-all cursor-pointer shadow-sm group/upload" onClick={() => fileInputRef.current?.click()}>
                <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls,.csv,.pdf,.docx" onChange={handleUpload} disabled={uploading} />
                <div className={`p-4 bg-blue-50 rounded-full mb-4 group-hover/upload:scale-110 transition-transform ${uploading ? 'animate-bounce' : ''}`}>
                  <UploadCloud className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-800 mb-2">{uploading ? 'Sedang Memproses...' : 'Upload Dokumen Knowledge'}</h3>
                <p className="text-xs text-slate-500 font-medium px-4">Excel, CSV, PDF, DOCX (Max 10MB). File panjang akan otomatis dipecah.</p>
              </div>

              {/* Card Input Manual */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-extrabold text-sm mb-4 text-slate-800 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div> Tambah Data Satuan
                </h3>
                <select 
                  value={manualForm.type} 
                  onChange={(e) => setManualForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full mb-4 p-3 text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 appearance-none cursor-pointer"
                >
                  <option value="qa">💬 Tanya Jawab (Q&A)</option>
                  <option value="product">📦 Data Produk</option>
                  <option value="google_sheet">📊 Import Google Sheet (Sekali Tarik)</option>
                </select>
                
                {manualForm.type === 'qa' ? (
                  <div className="space-y-3">
                    <input placeholder="Pertanyaan (Cth: Jam operasional?)" className="w-full p-3 text-sm font-medium border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" value={manualForm.question} onChange={e => setManualForm(p => ({ ...p, question: e.target.value }))} />
                    <textarea placeholder="Jawaban (Cth: Buka jam 8 pagi)" rows={2} className="w-full p-3 text-sm font-medium border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all resize-none" value={manualForm.answer} onChange={e => setManualForm(p => ({ ...p, answer: e.target.value }))}></textarea>
                    <button onClick={handleManualSubmit} className="mt-2 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all">Tambah Q&A</button>
                  </div>
                ) : manualForm.type === 'product' ? (
                  <div className="space-y-3 grid grid-cols-2 gap-x-3 gap-y-0">
                    <input placeholder="Nama Produk" className="col-span-2 mb-3 p-3 text-sm font-medium border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" value={manualForm.productName} onChange={e => setManualForm(p => ({ ...p, productName: e.target.value }))} />
                    <input placeholder="Kategori" className="mb-3 p-3 text-sm font-medium border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" value={manualForm.productCategory} onChange={e => setManualForm(p => ({ ...p, productCategory: e.target.value }))} />
                    <input type="number" placeholder="Harga" className="mb-3 p-3 text-sm font-medium border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" value={manualForm.price || ''} onChange={e => setManualForm(p => ({ ...p, price: Number(e.target.value) }))} />
                    <textarea placeholder="Deskripsi/Spesifikasi singkat..." rows={2} className="col-span-2 mb-3 p-3 text-sm font-medium border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all resize-none" value={manualForm.description} onChange={e => setManualForm(p => ({ ...p, description: e.target.value }))}></textarea>
                    <input placeholder="URL Gambar Produk (Opsional, dari Imgur/Google Drive)" className="col-span-2 mb-3 p-3 text-sm font-medium border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" value={manualForm.imageUrl} onChange={e => setManualForm(p => ({ ...p, imageUrl: e.target.value }))} />
                    <button onClick={handleManualSubmit} className="col-span-2 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all">Tambah Produk</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input placeholder="Link Google Sheet Publik" className="w-full mb-3 p-3 text-sm font-medium border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 bg-slate-50 focus:bg-white transition-all" value={googleSheetUrl} onChange={e => setGoogleSheetUrl(e.target.value)} />
                    <div className="flex items-start gap-3 bg-amber-50/80 p-3 rounded-xl border border-amber-200/60 mb-3">
                      <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <p className="text-[11px] font-medium text-amber-800/90 leading-relaxed">Jika data di Sheet berubah di masa depan, klik tombol &quot;Sync Ulang&quot; pada tabel di bawah untuk memperbarui data ke AI.</p>
                    </div>
                    <button onClick={handleGoogleSheetSubmit} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-xl text-sm font-bold shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all">Mulai Import Data</button>
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-hidden bg-white border border-slate-200 rounded-2xl relative z-10 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600">
                  <thead className="text-[11px] font-extrabold text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200 tracking-wider">
                    <tr>
                      <th className="px-5 py-4">Nama / Sumber Data</th>
                      <th className="px-5 py-4">Tipe</th>
                      <th className="px-5 py-4">Jumlah Item</th>
                      <th className="px-5 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {knowledgeSources.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-10 text-slate-400 font-medium">Belum ada data knowledge base. <br/><span className="text-xs">AI akan membalas menggunakan Profil Bisnis di atas.</span></td></tr>
                    ) : (
                      knowledgeSources.map(s => (
                        <React.Fragment key={s.id}>
                          <tr className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-4 font-bold text-slate-800">
                              {s.title}
                              {s.status === 'failed' && (
                                <p className="text-[10px] text-red-500 mt-1 font-medium bg-red-50 inline-block px-2 py-0.5 rounded-full">Gagal Sinkronisasi: {s.errorMessage || 'Terjadi kesalahan'}</p>
                              )}
                            </td>
                            <td className="px-5 py-4"><span className="bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide shadow-sm">{s.type}</span></td>
                            <td className="px-5 py-4 font-semibold">{s.itemCount}</td>
                            <td className="px-5 py-4 text-right">
                              {s.type === 'google_sheet' && s.googleSheetUrl && (
                                <button onClick={() => handleSyncGoogleSheet(s.id, s.googleSheetUrl)} disabled={syncingId === s.id} className="text-emerald-600 hover:text-white hover:bg-emerald-500 mr-3 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-200 hover:border-emerald-500 transition-all disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-emerald-600 shadow-sm">
                                  {syncingId === s.id ? 'Syncing...' : 'Sync Ulang'}
                                </button>
                              )}
                              <button onClick={() => handleDeleteKnowledge(s.id)} className="text-red-500 hover:text-white hover:bg-red-500 p-1.5 rounded-lg transition-all border border-transparent hover:border-red-600 shadow-sm hover:shadow-red-500/20"><Trash2 className="w-4 h-4 inline" /></button>
                            </td>
                          </tr>
                          {s.knowledgeItems && s.knowledgeItems.length > 0 && (
                            <tr className="bg-slate-50/80 border-t-0">
                              <td colSpan={4} className="px-5 py-4">
                                <p className="text-[10px] font-extrabold text-slate-400 mb-3 uppercase tracking-wider">Preview 5 Data Teratas:</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                  {s.knowledgeItems.map((item: any) => (
                                    <div key={item.id} className="bg-white p-3 border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
                                      <span className="font-bold text-[13px] text-slate-800 block truncate mb-1">
                                        {item.productName || item.question || 'Tanpa Nama'}
                                        {item.imageUrl && <span className="ml-1 px-1 bg-blue-100 text-blue-600 rounded text-[9px] uppercase font-bold">Image</span>}
                                      </span>
                                      <span className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                        {item.price ? <span className="text-emerald-600 font-bold bg-emerald-50 px-1 rounded mr-1">Rp {item.price.toLocaleString('id-ID')}</span> : ''}
                                        {item.answer || item.description || ''}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <ChatbotPreview chatLogs={chatLogs} />

        </div>

        <div className="space-y-8">

          <WhatsAppConnectionCard wahaStatus={wahaStatus} isComplete={stepsComplete.waha} />
          
          <AiIntegrationPanel form={form} handleChange={handleChange} />
          <AdvancedRulesPanel form={form} handleChange={handleChange} />

        </div>
      </div>
    </div>
    </div>
  );
}
