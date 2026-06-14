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
  const [whatsappStatus, setWhatsappStatus] = useState('disconnected');
  const [manualForm, setManualForm] = useState({ type: 'qa', question: '', answer: '', productName: '', productCategory: '', price: 0, stockStatus: 'Tersedia', description: '', imageUrl: '' });
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any

  const [form, setForm] = useState({
    businessName: '', businessIndustry: '', businessDescription: '', address: '', openingHours: '', adminPhone: '', websiteUrl: '', instagramUrl: '', marketplaceUrl: '',
    botName: '', toneStyle: 'Profesional', language: 'id', useEmoji: true, maxReplyLength: 'sedang', allowSelling: true, allowPromoOffer: true, allowVision: false, allowVoiceNote: false,
    fallbackMessage: '', handoverMessage: '', handoverKeywords: '', outOfHoursMessage: '',
    enableWelcomeMessage: false, welcomeMessage: '',
    aiProvider: 'Flaz Cloud', aiModel: 'gemini-2.5-flash-lite', aiApiKey: '',
    dailyChatLimit: 1000, monthlyChatLimit: 30000,
    historyMessageCount: 6, knowledgeCharLimit: 3500, actionWebhookUrl: '',
    isActive: false,
    templateId: '',
    productsOrServices: '', pricingInfo: '', paymentMethods: '', deliveryMethods: '', serviceArea: '', catalogUrl: '', mapsUrl: '', customFAQ: '',
    customLinks: [] as { title: string, url: string }[],
  });

  const [activeModelDisplay, setActiveModelDisplay] = useState('gemini-2.5-flash-lite');

  const fetchInitialData = useCallback(async () => {
    try {
      const [chatbotRes, knowledgeRes, logsRes, whatsappStatusRes, templatesRes] = await Promise.all([
        fetch('/api/dashboard/chatbot'),
        fetch('/api/dashboard/knowledge'),
        fetch('/api/dashboard/chat-logs?limit=5'),
        fetch('/api/dashboard/whatsapp/status'),
        fetch('/api/templates'),
      ]);

      if (chatbotRes.ok) {
        const json = await chatbotRes.json();
        if (json.businessProfile && json.chatbotSetting) {
          setForm({
            ...json.businessProfile,
            ...json.chatbotSetting,
            aiApiKey: json.chatbotSetting.aiApiKeyEncrypted ? '••••••••' : '',
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
            customLinks: json.businessProfile.customLinks ? JSON.parse(json.businessProfile.customLinks) : [],
          });
          
          if (json.hasGlobalKey && json.globalAiModel) {
            setActiveModelDisplay(`${json.globalAiModel} (Global)`);
          } else if (json.chatbotSetting?.aiModel) {
            setActiveModelDisplay(json.chatbotSetting.aiModel);
          }
        }
      }

      if (knowledgeRes.ok) setKnowledgeSources((await knowledgeRes.json()).sources || []);
      if (logsRes.ok) setChatLogs((await logsRes.json()).logs || []);
      
      if (whatsappStatusRes.ok) {
        const { status } = await whatsappStatusRes.json();
        setWhatsappStatus(status);
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
    whatsapp: whatsappStatus === 'connected'
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
          
          <BusinessProfileForm form={form} handleChange={handleChange} isComplete={stepsComplete.profile} setForm={setForm} />
          
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
                Step 3: Basis Pengetahuan (Template)
              </h2>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100/50 mb-6 relative z-10 shadow-sm">
              <h3 className="font-extrabold text-sm mb-2 text-blue-900">Template Sistem Bot</h3>
              <p className="text-xs text-blue-700/80 mb-4 font-medium">Pilih Template Usaha yang akan mengatur cara AI melayani dan merespons pelanggan Anda secara spesifik.</p>
              <select name="templateId" value={form.templateId || ''} onChange={handleChange} className="w-full p-3.5 bg-white border border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-semibold text-slate-700 shadow-sm appearance-none cursor-pointer">
                <option value="">-- Pilih Template Usaha --</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="mt-6 flex flex-col items-center justify-center p-6 bg-slate-50/80 rounded-2xl border border-dashed border-slate-300 relative z-10 text-center">
              <Database className="w-10 h-10 text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-700 mb-1">Manajemen Knowledge Base</h3>
              <p className="text-sm text-slate-500 mb-4 max-w-sm">Upload PDF, Excel, atau Import Google Sheet sekarang dipindahkan ke menu khusus agar lebih rapi.</p>
              <a href="/dashboard/knowledge" className="px-5 py-2.5 bg-white border border-slate-200 text-blue-600 font-bold rounded-xl shadow-sm hover:border-blue-300 hover:bg-blue-50 transition-all flex items-center gap-2">
                Buka Menu Knowledge Base <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
              </a>
            </div>
          </section>

          <ChatbotPreview chatLogs={chatLogs} />

        </div>

        <div className="space-y-8">

          <WhatsAppConnectionCard whatsappStatus={whatsappStatus} isComplete={stepsComplete.whatsapp} />
          <AdvancedRulesPanel form={form} handleChange={handleChange} />

        </div>
      </div>
    </div>
    </div>
  );
}
