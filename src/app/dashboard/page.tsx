'use client';

import { useState, useEffect } from 'react';
import { Bot, MessageSquare, Users, ShieldAlert, CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

export default function DashboardIndex() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({ todayChats: 0, monthlyChats: 0, newLeads: 0, needsHuman: 0 });
  const [status, setStatus] = useState({
    hasProfile: false,
    hasKnowledge: false,
    wahaStatus: 'disconnected',
    isBotActive: false,
    planName: 'Free',
    allowCustomKey: false,
    hasGlobalKey: false,
    hasCustomKey: false
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [botRes, anaRes, wahaRes, globalKeyRes] = await Promise.all([
          fetch('/api/dashboard/chatbot'),
          fetch('/api/dashboard/analytics'),
          fetch('/api/dashboard/waha/status'),
          fetch('/api/dashboard/chatbot/global-key-check')
        ]);
        
        let hasProf = false, hasKnow = false, isAct = false, plan = 'Free', allowCustom = false, hasCustom = false;
        if (botRes.ok) {
          const data = await botRes.json();
          hasProf = !!data.businessProfile?.businessName;
          hasKnow = (data.knowledgeCount || 0) > 0;
          isAct = !!data.chatbotSetting?.isActive;
          plan = data.subscription?.plan?.name || 'Free';
          allowCustom = !!data.subscription?.plan?.allowCustomApiKey;
          hasCustom = !!data.chatbotSetting?.aiApiKeyEncrypted;
        }
        
        if (anaRes.ok) setAnalytics(await anaRes.json());
        
        let waha = 'disconnected';
        if (wahaRes.ok) waha = (await wahaRes.json()).status;

        let hasGlobal = false;
        if (globalKeyRes.ok) hasGlobal = (await globalKeyRes.json()).hasGlobalKey;

        setStatus({
          hasProfile: hasProf,
          hasKnowledge: hasKnow,
          wahaStatus: waha,
          isBotActive: isAct,
          planName: plan,
          allowCustomKey: allowCustom,
          hasGlobalKey: hasGlobal,
          hasCustomKey: hasCustom
        });
      } catch {
        toast.error('Gagal memuat data overview');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><span className="animate-pulse text-blue-600 font-medium">Memuat Overview...</span></div>;

  const isAiKeyReady = status.hasGlobalKey || (status.allowCustomKey && status.hasCustomKey);
  const isWahaReady = status.wahaStatus === 'connected';
  const allSetupReady = status.hasProfile && status.hasKnowledge && isWahaReady && isAiKeyReady;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <Toaster position="top-right" />
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1">Paket aktif: <span className="font-semibold text-blue-600">{status.planName}</span></p>
        </div>
        <div className={`px-4 py-2 rounded-xl font-medium border ${status.isBotActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
          Bot Status: {status.isBotActive ? 'Aktif 🟢' : 'Nonaktif 🔴'}
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
            <p className={`text-xl font-bold ${isWahaReady ? 'text-emerald-600' : 'text-amber-600 capitalize'}`}>{status.wahaStatus}</p>
          </div>
        </div>
      </div>

      {/* Onboarding Checklist */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Checklist Setup Chatbot</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 border rounded-xl bg-slate-50">
            {status.hasProfile ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Circle className="w-6 h-6 text-slate-300" />}
            <div className="flex-1">
              <p className="font-semibold text-slate-700">Profil Bisnis</p>
              <p className="text-xs text-slate-500">Isi detail bisnis agar bot mengerti identitas Anda.</p>
            </div>
            {!status.hasProfile && <Link href="/dashboard/chatbot" className="text-sm text-blue-600 hover:underline font-medium">Lengkapi</Link>}
          </div>

          <div className="flex items-center gap-3 p-4 border rounded-xl bg-slate-50">
            {status.hasKnowledge ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Circle className="w-6 h-6 text-slate-300" />}
            <div className="flex-1">
              <p className="font-semibold text-slate-700">Knowledge Base</p>
              <p className="text-xs text-slate-500">Minimal 1 data sumber agar bot bisa menjawab pertanyaan.</p>
            </div>
            {!status.hasKnowledge && <Link href="/dashboard/chatbot" className="text-sm text-blue-600 hover:underline font-medium">Tambah</Link>}
          </div>

          <div className="flex items-center gap-3 p-4 border rounded-xl bg-slate-50">
            {isWahaReady ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Circle className="w-6 h-6 text-slate-300" />}
            <div className="flex-1">
              <p className="font-semibold text-slate-700">Koneksi WhatsApp</p>
              <p className="text-xs text-slate-500">Scan QR Code agar bot bisa merespon pesan WhatsApp.</p>
            </div>
            {!isWahaReady && <Link href="/dashboard/waha" className="text-sm text-blue-600 hover:underline font-medium">Hubungkan</Link>}
          </div>

          <div className="flex items-center gap-3 p-4 border rounded-xl bg-slate-50">
            {isAiKeyReady ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Circle className="w-6 h-6 text-amber-500" />}
            <div className="flex-1">
              <p className="font-semibold text-slate-700">Akses AI</p>
              <p className="text-xs text-slate-500">{status.hasGlobalKey ? 'Akses Global Aktif' : status.allowCustomKey ? 'Gunakan API Key Sendiri' : 'Global API Key belum diset Admin'}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            {allSetupReady 
              ? '✅ Semua setup sudah selesai! Anda bisa mengaktifkan bot.' 
              : '⚠️ Selesaikan checklist di atas sebelum dapat mengaktifkan bot.'}
          </p>
          <Link 
            href="/dashboard/chatbot" 
            className={`px-6 py-2 rounded-xl font-medium text-white transition-all shadow-md ${allSetupReady ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-slate-400 cursor-not-allowed'}`}
          >
            Menuju Pengaturan Bot
          </Link>
        </div>
      </section>
    </div>
  );
}
