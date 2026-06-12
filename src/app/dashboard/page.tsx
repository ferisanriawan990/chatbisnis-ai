import { Bot, MessageSquare, Users, ShieldAlert, CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getActiveWahaSessionName, assertUserOwnsWahaSession } from '@/lib/waha-helpers';
import { WAHAService } from '@/lib/waha';

export default async function DashboardIndex() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const userId = (session.user as { id: string }).id;

  // 1. Get Chatbot Setting & Profile
  const chatbotSetting = await prisma.chatbotSetting.findFirst({
    where: { userId },
    include: { businessProfile: true, wahaServer: true },
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
  const planName = subscription?.plan?.name || 'Free';
  const allowCustomKey = !!subscription?.plan?.allowCustomApiKey;
  const hasCustomKey = !!chatbotSetting?.aiApiKeyEncrypted;

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

  // 5. WAHA Status
  let wahaStatus = 'disconnected';
  if (chatbotSetting && businessProfile) {
    const activeSessionName = getActiveWahaSessionName(userId, businessProfile.id);
    const ownsSession = await assertUserOwnsWahaSession(userId, activeSessionName);
    const wahaServer = chatbotSetting.wahaServer;
    
    if (ownsSession && wahaServer?.apiKeyEncrypted) {
      try {
        const waha = WAHAService.fromEncrypted(wahaServer.baseUrl, wahaServer.apiKeyEncrypted);
        wahaStatus = await waha.getStatus(activeSessionName);
      } catch {
        wahaStatus = 'disconnected';
      }
    }
  }

  // 6. Compute Ready Status
  const isAiKeyReady = hasGlobalKey || (allowCustomKey && hasCustomKey);
  const isWahaReady = wahaStatus === 'connected';
  const allSetupReady = hasProf && isWahaReady && isAiKeyReady;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1">Paket aktif: <span className="font-semibold text-blue-600">{planName}</span></p>
        </div>
        <div className={`px-4 py-2 rounded-xl font-medium border ${isAct ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
          Bot Status: {isAct ? 'Aktif 🟢' : 'Nonaktif 🔴'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="bg-blue-50 p-3 rounded-lg"><MessageSquare className="w-6 h-6 text-blue-600" /></div>
           <div><p className="text-sm text-slate-500">Chat Hari Ini</p><p className="text-xl font-bold">{todayChats}</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="bg-emerald-50 p-3 rounded-lg"><Users className="w-6 h-6 text-emerald-600" /></div>
           <div><p className="text-sm text-slate-500">Lead Baru (7H)</p><p className="text-xl font-bold">{newLeads}</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="bg-amber-50 p-3 rounded-lg"><ShieldAlert className="w-6 h-6 text-amber-600" /></div>
           <div><p className="text-sm text-slate-500">Butuh Admin</p><p className="text-xl font-bold text-amber-600">{needsHuman}</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="bg-purple-50 p-3 rounded-lg"><Bot className="w-6 h-6 text-purple-600" /></div>
           <div>
            <p className="text-sm text-slate-500">Status WAHA</p>
            <p className={`text-xl font-bold ${isWahaReady ? 'text-emerald-600' : 'text-amber-600 capitalize'}`}>{wahaStatus}</p>
          </div>
        </div>
      </div>

      {/* Onboarding Checklist */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Checklist Setup Chatbot</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 border rounded-xl bg-slate-50">
            {hasProf ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Circle className="w-6 h-6 text-slate-300" />}
            <div className="flex-1">
              <p className="font-semibold text-slate-700">Profil Bisnis</p>
              <p className="text-xs text-slate-500">Isi detail bisnis agar bot mengerti identitas Anda.</p>
            </div>
            {!hasProf && <Link href="/dashboard/chatbot" className="text-sm text-blue-600 hover:underline font-medium">Lengkapi</Link>}
          </div>

          <div className="flex items-center gap-3 p-4 border rounded-xl bg-slate-50">
            {hasKnow ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Circle className="w-6 h-6 text-slate-300" />}
            <div className="flex-1">
              <p className="font-semibold text-slate-700">Knowledge Base</p>
              <p className="text-xs text-slate-500">Minimal 1 data sumber agar bot bisa menjawab pertanyaan.</p>
            </div>
            {!hasKnow && <Link href="/dashboard/chatbot" className="text-sm text-blue-600 hover:underline font-medium">Tambah</Link>}
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
              <p className="text-xs text-slate-500">{hasGlobalKey ? 'Akses Global Aktif' : allowCustomKey ? 'Gunakan API Key Sendiri' : 'Global API Key belum diset Admin'}</p>
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
