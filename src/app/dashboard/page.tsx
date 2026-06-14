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
    include: { businessProfile: true },
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
    where: { userId, status: 'active', OR: [{ expiredAt: null }, { expiredAt: { gt: new Date() } }] },
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

      {/* Onboarding Checklist Section */}
      {!allSetupReady && (
        <section className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_4px_30px_rgb(0,0,0,0.06)] border border-indigo-100 relative overflow-hidden animate-in slide-in-from-top-4 fade-in duration-700">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-indigo-50 to-purple-50 rounded-full blur-[80px] opacity-60 pointer-events-none"></div>
          <div className="relative z-10 flex items-center gap-4 mb-8">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-500/30"><Zap className="w-6 h-6" /></div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Mulai Perjalanan Anda 🚀</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Selesaikan 3 langkah mudah ini agar asisten AI Anda siap beraksi melayani pelanggan.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div className={`flex flex-col p-6 border-2 rounded-3xl transition-all duration-300 ${hasProf ? 'border-emerald-100 bg-emerald-50/50' : 'border-indigo-100 bg-white hover:border-indigo-300 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${hasProf ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-50 text-indigo-500'}`}>
                  {hasProf ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg ${hasProf ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  Langkah 1
                </span>
              </div>
              <h3 className="font-extrabold text-lg text-slate-800 mb-2">Profil Bisnis</h3>
              <p className="text-xs font-medium text-slate-500 flex-1 mb-6 leading-relaxed">Beritahu AI nama bisnis, jam buka, dan karakter usahanya.</p>
              {!hasProf ? (
                <Link href="/dashboard/chatbot" className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                  Isi Profil <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <span className="w-full py-3 bg-emerald-100 text-emerald-700 text-sm font-bold rounded-xl flex items-center justify-center gap-2">Selesai ✓</span>
              )}
            </div>

            <div className={`flex flex-col p-6 border-2 rounded-3xl transition-all duration-300 ${hasKnow ? 'border-emerald-100 bg-emerald-50/50' : 'border-indigo-100 bg-white hover:border-indigo-300 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${hasKnow ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-50 text-indigo-500'}`}>
                  {hasKnow ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg ${hasKnow ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  Langkah 2
                </span>
              </div>
              <h3 className="font-extrabold text-lg text-slate-800 mb-2">Knowledge Base</h3>
              <p className="text-xs font-medium text-slate-500 flex-1 mb-6 leading-relaxed">Upload data produk atau FAQ (Opsional, tapi sangat disarankan).</p>
              {!hasKnow ? (
                <Link href="/dashboard/knowledge" className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                  Tambah Data <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <span className="w-full py-3 bg-emerald-100 text-emerald-700 text-sm font-bold rounded-xl flex items-center justify-center gap-2">Selesai ✓</span>
              )}
            </div>

            <div className={`flex flex-col p-6 border-2 rounded-3xl transition-all duration-300 ${isWhatsappReady ? 'border-emerald-100 bg-emerald-50/50' : 'border-indigo-100 bg-white hover:border-indigo-300 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${isWhatsappReady ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-50 text-indigo-500'}`}>
                  {isWhatsappReady ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg ${isWhatsappReady ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  Langkah 3
                </span>
              </div>
              <h3 className="font-extrabold text-lg text-slate-800 mb-2">Hubungkan WhatsApp</h3>
              <p className="text-xs font-medium text-slate-500 flex-1 mb-6 leading-relaxed">Scan QR Code atau gunakan Nomor HP untuk menghubungkan bot ke WA.</p>
              {!isWhatsappReady ? (
                <Link href="/dashboard/whatsapp" className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                  Koneksikan WA <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <span className="w-full py-3 bg-emerald-100 text-emerald-700 text-sm font-bold rounded-xl flex items-center justify-center gap-2">Selesai ✓</span>
              )}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
