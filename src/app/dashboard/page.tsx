import { Bot, MessageSquare, Users, ShieldAlert, CheckCircle2, Circle, Activity, ChevronRight, Zap } from 'lucide-react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getActiveWhatsappSessionName } from '@/lib/whatsapp-helpers';
import { BaileysService } from '@/lib/baileys';

export default async function DashboardIndex() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const userId = (session.user as { id: string }).id;

  // 1. Get Chatbot Setting & Profile
  const chatbotSetting = await prisma.chatbotSetting.findFirst({
    where: { userId },
    include: { businessProfile: true, whatsappServer: true },
  });

  const businessProfile = chatbotSetting?.businessProfile;
  const hasProf = !!businessProfile?.businessName;
  const isAct = !!chatbotSetting?.isActive;

  // 2. Get Knowledge Count
  const knowledgeCount = await prisma.knowledgeItem.count({
    where: { userId, isActive: true },
  });
  const hasKnow = knowledgeCount > 0;

  // 3. Subscription & Global Key
  const subscription = await prisma.subscription.findFirst({
    where: { userId, status: 'active' },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });
  const planName = subscription?.plan?.name || 'Free Trial';

  const globalKey = await prisma.secretCredential.findUnique({ where: { key: 'FLAZ_API_KEY_GLOBAL' } });
  const hasGlobalKey = globalKey !== null && globalKey.isActive === true;

  // 4. Analytics
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  let todayChats = 0, newLeads = 0, needsHuman = 0;
  if (chatbotSetting) {
    [todayChats, newLeads, needsHuman] = await Promise.all([
      prisma.chatLog.count({ where: { chatbotSettingId: chatbotSetting.id, createdAt: { gte: today } } }),
      prisma.lead.count({ where: { businessProfileId: chatbotSetting.businessProfileId, createdAt: { gte: sevenDaysAgo } } }),
      prisma.chatLog.count({ where: { chatbotSettingId: chatbotSetting.id, needsHuman: true, status: 'success' } }),
    ]);
  }

  // 5. WhatsApp Gateway Status
  let whatsappStatus = 'disconnected';
  if (chatbotSetting && businessProfile) {
    const activeSessionName = getActiveWhatsappSessionName(userId, businessProfile.id);
    try {
      const { gateway } = await BaileysService.resolveInstance(chatbotSetting.id);
      whatsappStatus = (await gateway.getStatus(activeSessionName)).normalizedStatus;
    } catch {
      whatsappStatus = 'disconnected';
    }
  }

  // 6. Compute Ready Status
  const isAiKeyReady = hasGlobalKey;
  const isWhatsappReady = whatsappStatus === 'connected';
  const allSetupReady = hasProf && isWhatsappReady && isAiKeyReady;

  return (
    <div className="space-y-8 font-sans pb-12">
      
      {/* Premium Greeting Banner */}
      <div className="relative overflow-hidden bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:justify-between md:items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Selamat Datang, {session.user.name?.split(' ')[0] || 'User'}! 👋
            </h1>
            <p className="text-slate-500 mt-2 text-lg">Pantau performa asisten AI Anda dan kelola operasional bisnis.</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 w-max">
              <span className="text-sm font-medium text-slate-500">Paket Aktif:</span>
              <span className="text-sm font-bold text-indigo-700 uppercase tracking-wider">{planName}</span>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border w-max font-bold ${
              isAct ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {isAct ? (
                <><Activity className="w-4 h-4 animate-pulse" /> Bot AI Aktif Menerima Pesan</>
              ) : (
                <><ShieldAlert className="w-4 h-4" /> Bot AI Sedang Nonaktif</>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:-translate-y-1 transition-transform duration-300">
           <div className="flex justify-between items-start mb-4">
             <div className="bg-blue-50 p-3 rounded-2xl"><MessageSquare className="w-6 h-6 text-blue-600" /></div>
           </div>
           <div>
             <p className="text-4xl font-black text-slate-800 tracking-tight">{todayChats}</p>
             <p className="text-sm font-medium text-slate-500 mt-1">Interaksi Chat Hari Ini</p>
           </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:-translate-y-1 transition-transform duration-300">
           <div className="flex justify-between items-start mb-4">
             <div className="bg-emerald-50 p-3 rounded-2xl"><Users className="w-6 h-6 text-emerald-600" /></div>
           </div>
           <div>
             <p className="text-4xl font-black text-slate-800 tracking-tight">{newLeads}</p>
             <p className="text-sm font-medium text-slate-500 mt-1">Lead Baru (7 Hari Terakhir)</p>
           </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
           <div className={`absolute inset-0 opacity-0 transition-opacity duration-300 ${needsHuman > 0 ? 'bg-amber-50 group-hover:opacity-100' : ''} pointer-events-none`}></div>
           <div className="relative z-10">
             <div className="flex justify-between items-start mb-4">
               <div className="bg-amber-50 p-3 rounded-2xl group-hover:bg-amber-100 transition-colors"><ShieldAlert className="w-6 h-6 text-amber-600" /></div>
             </div>
             <div>
               <p className={`text-4xl font-black tracking-tight ${needsHuman > 0 ? 'text-amber-600' : 'text-slate-800'}`}>{needsHuman}</p>
               <p className="text-sm font-medium text-slate-500 mt-1">Chat Butuh Bantuan Admin</p>
             </div>
           </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:-translate-y-1 transition-transform duration-300">
           <div className="flex justify-between items-start mb-4">
             <div className={`p-3 rounded-2xl ${isWhatsappReady ? 'bg-teal-50' : 'bg-slate-100'}`}>
               <Bot className={`w-6 h-6 ${isWhatsappReady ? 'text-teal-600' : 'text-slate-500'}`} />
             </div>
           </div>
           <div>
             <p className={`text-2xl font-black tracking-tight capitalize truncate ${isWhatsappReady ? 'text-teal-600' : 'text-slate-600'}`}>{whatsappStatus}</p>
             <p className="text-sm font-medium text-slate-500 mt-1">Status Koneksi WhatsApp</p>
           </div>
        </div>
      </div>

      {/* Onboarding Checklist Section */}
      <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200/60">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600"><Zap className="w-5 h-5" /></div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Checklist Persiapan Chatbot</h2>
            <p className="text-sm text-slate-500">Selesaikan langkah berikut agar asisten AI Anda siap melayani pelanggan.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`flex flex-col p-5 border-2 rounded-2xl transition-all ${hasProf ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-100 bg-slate-50 hover:border-indigo-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${hasProf ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                {hasProf ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
              </div>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${hasProf ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                Langkah 1
              </span>
            </div>
            <h3 className="font-bold text-slate-800 mb-1">Profil Bisnis</h3>
            <p className="text-xs text-slate-500 flex-1 mb-4">Isi nama bisnis, industri, dan gaya bahasa agar bot mengerti identitas usahanya.</p>
            {!hasProf ? (
              <Link href="/dashboard/chatbot" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group">
                Lengkapi Sekarang <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <span className="text-sm font-bold text-emerald-600">Selesai ✓</span>
            )}
          </div>

          <div className={`flex flex-col p-5 border-2 rounded-2xl transition-all ${hasKnow ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-100 bg-slate-50 hover:border-indigo-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${hasKnow ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                {hasKnow ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
              </div>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${hasKnow ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                Langkah 2
              </span>
            </div>
            <h3 className="font-bold text-slate-800 mb-1">Knowledge Base</h3>
            <p className="text-xs text-slate-500 flex-1 mb-4">Unggah data, Q&A, atau aturan toko sebagai sumber pengetahuan utama bot.</p>
            {!hasKnow ? (
              <Link href="/dashboard/knowledge" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group">
                Tambah Data <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <span className="text-sm font-bold text-emerald-600">Selesai ✓</span>
            )}
          </div>

          <div className={`flex flex-col p-5 border-2 rounded-2xl transition-all ${isWhatsappReady ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-100 bg-slate-50 hover:border-indigo-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${isWhatsappReady ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                {isWhatsappReady ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
              </div>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${isWhatsappReady ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                Langkah 3
              </span>
            </div>
            <h3 className="font-bold text-slate-800 mb-1">Koneksi WhatsApp</h3>
            <p className="text-xs text-slate-500 flex-1 mb-4">Tautkan nomor WhatsApp Anda dengan memindai QR Code di sistem.</p>
            {!isWhatsappReady ? (
              <Link href="/dashboard/whatsapp" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group">
                Hubungkan Perangkat <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <span className="text-sm font-bold text-emerald-600">Selesai ✓</span>
            )}
          </div>

          <div className={`flex flex-col p-5 border-2 rounded-2xl transition-all ${isAiKeyReady ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-100 bg-slate-50'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${isAiKeyReady ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                {isAiKeyReady ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
              </div>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${isAiKeyReady ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                Sistem
              </span>
            </div>
            <h3 className="font-bold text-slate-800 mb-1">Akses Koneksi AI</h3>
            <p className="text-xs text-slate-500 flex-1 mb-4">{hasGlobalKey ? 'Akses Global OpenAI/LLM telah diaktifkan oleh sistem.' : 'Kunci API Global belum disiapkan oleh admin. Hubungi CS.'}</p>
            {isAiKeyReady && (
              <span className="text-sm font-bold text-emerald-600">Selesai ✓</span>
            )}
          </div>
        </div>

        <div className={`mt-8 p-6 rounded-2xl border-2 flex flex-col sm:flex-row items-center justify-between gap-6 transition-all ${allSetupReady ? 'bg-indigo-600 border-indigo-500 shadow-xl shadow-indigo-600/20' : 'bg-slate-50 border-slate-100 border-dashed'}`}>
          <div>
            <h4 className={`text-lg font-bold mb-1 ${allSetupReady ? 'text-white' : 'text-slate-700'}`}>
              {allSetupReady ? '🚀 Semua Siap! Aktifkan Asisten Anda' : '⚠️ Persiapan Belum Selesai'}
            </h4>
            <p className={`text-sm ${allSetupReady ? 'text-indigo-100' : 'text-slate-500'}`}>
              {allSetupReady 
                ? 'Sistem siap dioperasikan. Aktifkan bot untuk mulai membalas chat secara otomatis.' 
                : 'Harap selesaikan seluruh checklist di atas terlebih dahulu untuk bisa mengaktifkan Bot.'}
            </p>
          </div>
          <Link 
            href="/dashboard/chatbot" 
            className={`px-8 py-3.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              allSetupReady 
                ? 'bg-white text-indigo-600 hover:bg-slate-50 hover:scale-105 shadow-md' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Menuju Pengaturan Bot <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
