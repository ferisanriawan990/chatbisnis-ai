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
  const [manualForm, setManualForm] = useState({ type: 'qa', question: '', answer: '', productName: '', productCategory: '', price: 0, stockStatus: 'Tersedia', description: '' });
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any

  const [form, setForm] = useState({
    businessName: '', businessIndustry: '', businessDescription: '', address: '', openingHours: '', adminPhone: '', websiteUrl: '', instagramUrl: '', marketplaceUrl: '',
    botName: '', toneStyle: 'Profesional', language: 'id', useEmoji: true, maxReplyLength: 'sedang', allowSelling: true, allowPromoOffer: true,
    fallbackMessage: '', handoverMessage: '', handoverKeywords: '', outOfHoursMessage: '',
    aiProvider: 'Flaz Cloud', aiModel: 'gpt-4o-mini', aiApiKey: '',
    dailyChatLimit: 1000, monthlyChatLimit: 30000,
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
        setManualForm({ type: 'qa', question: '', answer: '', productName: '', productCategory: '', price: 0, stockStatus: 'Tersedia', description: '' });
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
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <Toaster position="top-right" />
      
      {/* Header & Status Bot */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Bot className="w-8 h-8 text-blue-600" />
            Pengaturan Chatbot AI
          </h1>
          <p className="text-slate-500 mt-1">Lengkapi langkah-langkah di bawah untuk mengaktifkan asisten virtual Anda.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          <BusinessProfileForm form={form} handleChange={handleChange} isComplete={stepsComplete.profile} />
          
          <AIStyleForm form={form} handleChange={handleChange} activeModelDisplay={activeModelDisplay} />

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              {stepsComplete.knowledge ? <CheckCircle2 className="w-8 h-8 text-emerald-400 opacity-20" /> : <span className="text-4xl font-black text-slate-100">3</span>}
            </div>
            <div className="flex justify-between items-center mb-4 relative z-10">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Database className="w-5 h-5 text-blue-500" /> Step 3: Knowledge Base (Opsional)</h2>
              <Link href="/api/dashboard/knowledge/template" className="text-blue-600 font-medium hover:underline flex items-center gap-1">
                <Download className="w-4 h-4" /> Template Excel
              </Link>
            </div>
            
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6 relative z-10">
              <h3 className="font-semibold text-sm mb-2 text-slate-800">Template Bot Utama</h3>
              <p className="text-xs text-slate-500 mb-3">Pilih Template Usaha yang akan menjadi dasar pengetahuan AI sebelum membaca Knowledge Base khusus.</p>
              <select name="templateId" value={form.templateId || ''} onChange={handleChange} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none text-sm">
                <option value="">-- Pilih Template Usaha --</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 mb-6">
              {/* Card Upload File */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls,.csv,.pdf,.docx" onChange={handleUpload} disabled={uploading} />
                <UploadCloud className={`w-10 h-10 text-blue-500 mb-3 ${uploading ? 'animate-bounce' : ''}`} />
                <h3 className="font-semibold text-sm text-slate-800 mb-1">{uploading ? 'Sedang Memproses...' : 'Upload Dokumen Knowledge'}</h3>
                <p className="text-xs text-slate-500">Mendukung Excel, CSV, PDF, DOCX (Max 10MB). File panjang akan otomatis dipecah.</p>
              </div>

              {/* Card Input Manual */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <h3 className="font-semibold text-sm mb-3 text-slate-800">Atau Tambah Data Satuan</h3>
                <select 
                  value={manualForm.type} 
                  onChange={(e) => setManualForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full mb-3 p-2 text-sm border border-slate-300 rounded outline-none focus:border-blue-500"
                >
                  <option value="qa">Tanya Jawab (Q&A)</option>
                  <option value="product">Data Produk</option>
                  <option value="google_sheet">Import Google Sheet (Sekali Tarik)</option>
                </select>
                
                {manualForm.type === 'qa' ? (
                  <div className="space-y-2">
                    <input placeholder="Pertanyaan (Cth: Jam operasional?)" className="w-full p-2 text-sm border border-slate-300 rounded outline-none focus:border-blue-500" value={manualForm.question} onChange={e => setManualForm(p => ({ ...p, question: e.target.value }))} />
                    <textarea placeholder="Jawaban (Cth: Buka jam 8 pagi)" className="w-full p-2 text-sm border border-slate-300 rounded outline-none focus:border-blue-500" value={manualForm.answer} onChange={e => setManualForm(p => ({ ...p, answer: e.target.value }))}></textarea>
                    <button onClick={handleManualSubmit} className="mt-2 w-full bg-blue-600 text-white py-2 rounded text-sm font-semibold hover:bg-blue-700 transition">Tambah Q&A</button>
                  </div>
                ) : manualForm.type === 'product' ? (
                  <div className="space-y-2 grid grid-cols-2 gap-2">
                    <input placeholder="Nama Produk" className="col-span-2 p-2 text-sm border border-slate-300 rounded outline-none focus:border-blue-500" value={manualForm.productName} onChange={e => setManualForm(p => ({ ...p, productName: e.target.value }))} />
                    <input placeholder="Kategori" className="p-2 text-sm border border-slate-300 rounded outline-none focus:border-blue-500" value={manualForm.productCategory} onChange={e => setManualForm(p => ({ ...p, productCategory: e.target.value }))} />
                    <input type="number" placeholder="Harga" className="p-2 text-sm border border-slate-300 rounded outline-none focus:border-blue-500" value={manualForm.price || ''} onChange={e => setManualForm(p => ({ ...p, price: Number(e.target.value) }))} />
                    <textarea placeholder="Deskripsi/Spesifikasi singkat..." className="col-span-2 p-2 text-sm border border-slate-300 rounded outline-none focus:border-blue-500" value={manualForm.description} onChange={e => setManualForm(p => ({ ...p, description: e.target.value }))}></textarea>
                    <button onClick={handleManualSubmit} className="mt-2 col-span-2 w-full bg-blue-600 text-white py-2 rounded text-sm font-semibold hover:bg-blue-700 transition">Tambah Produk</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input placeholder="Link Google Sheet Publik" className="w-full p-2 text-sm border border-slate-300 rounded outline-none focus:border-emerald-500" value={googleSheetUrl} onChange={e => setGoogleSheetUrl(e.target.value)} />
                    <div className="flex items-start gap-2 bg-amber-50 p-2 rounded border border-amber-200">
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-amber-800">Jika data di Sheet berubah, klik &quot;Sync Ulang&quot; pada tabel di bawah.</p>
                    </div>
                    <button onClick={handleGoogleSheetSubmit} className="mt-2 w-full bg-emerald-600 text-white py-2 rounded text-sm font-semibold hover:bg-emerald-700 transition">Mulai Import Data</button>
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-x-auto relative z-10">
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
                      <React.Fragment key={s.id}>
                        <tr className="border-b border-slate-100">
                          <td className="px-4 py-3 font-medium">
                            {s.title}
                            {s.status === 'failed' && (
                              <p className="text-xs text-red-500 mt-1">Gagal Sinkronisasi: {s.errorMessage || 'Terjadi kesalahan'}</p>
                            )}
                          </td>
                          <td className="px-4 py-3"><span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs uppercase">{s.type}</span></td>
                          <td className="px-4 py-3">{s.itemCount}</td>
                          <td className="px-4 py-3 text-right">
                            {s.type === 'google_sheet' && s.googleSheetUrl && (
                              <button onClick={() => handleSyncGoogleSheet(s.id, s.googleSheetUrl)} disabled={syncingId === s.id} className="text-emerald-600 hover:text-emerald-800 mr-3 text-xs font-semibold disabled:opacity-50">
                                {syncingId === s.id ? 'Syncing...' : 'Sync Ulang'}
                              </button>
                            )}
                            <button onClick={() => handleDeleteKnowledge(s.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4 inline" /></button>
                          </td>
                        </tr>
                        {s.knowledgeItems && s.knowledgeItems.length > 0 && (
                          <tr className="border-b border-slate-200 bg-slate-50">
                            <td colSpan={4} className="px-4 py-3">
                              <p className="text-xs font-bold text-slate-500 mb-2">Preview 5 Data Teratas:</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {s.knowledgeItems.map((item: any) => (
                                  <div key={item.id} className="text-xs bg-white p-2 border border-slate-200 rounded">
                                    <span className="font-semibold text-slate-700 block truncate">
                                      {item.productName || item.question || 'Tanpa Nama'}
                                    </span>
                                    <span className="text-slate-500 line-clamp-1">
                                      {item.price ? `Rp ${item.price.toLocaleString('id-ID')} - ` : ''}
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
          </section>

          <ChatbotPreview chatLogs={chatLogs} />

        </div>

        <div className="space-y-8">

          <WhatsAppConnectionCard wahaStatus={wahaStatus} isComplete={stepsComplete.waha} />
          
          <AdvancedRulesPanel form={form} handleChange={handleChange} />

        </div>
      </div>
    </div>
  );
}
