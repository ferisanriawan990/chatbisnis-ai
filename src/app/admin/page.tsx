'use client';

import { useEffect, useState } from 'react';
import { Users, MessageSquare, Database, Server, Activity, Zap, UserCheck, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalChatsToday: 0,
    totalChatsThisMonth: 0,
    totalLeads: 0,
    activeWhatsappSessions: 0,
    failedWhatsappSessions: 0,
    totalAiUsage: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/overview')
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setStats(d);
      })
      .catch(e => toast.error('Gagal memuat overview: ' + e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><span className="animate-pulse text-indigo-600 font-medium text-lg">Memuat data overview...</span></div>;

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, bgGradient: 'from-blue-100 to-blue-50', textGradient: 'from-blue-600 to-blue-800', text: 'text-blue-600' },
    { label: 'Bot Aktif', value: stats.activeUsers, icon: UserCheck, bgGradient: 'from-emerald-100 to-emerald-50', textGradient: 'from-emerald-600 to-emerald-800', text: 'text-emerald-600' },
    { label: 'Chat Hari Ini', value: stats.totalChatsToday, icon: MessageSquare, bgGradient: 'from-indigo-100 to-indigo-50', textGradient: 'from-indigo-600 to-indigo-800', text: 'text-indigo-600' },
    { label: 'Chat Bulan Ini', value: stats.totalChatsThisMonth, icon: Activity, bgGradient: 'from-purple-100 to-purple-50', textGradient: 'from-purple-600 to-purple-800', text: 'text-purple-600' },
    { label: 'Total Leads', value: stats.totalLeads, icon: Database, bgGradient: 'from-cyan-100 to-cyan-50', textGradient: 'from-cyan-600 to-cyan-800', text: 'text-cyan-600' },
    { label: 'WhatsApp Connected', value: stats.activeWhatsappSessions, icon: Server, bgGradient: 'from-emerald-100 to-emerald-50', textGradient: 'from-emerald-600 to-emerald-800', text: 'text-emerald-600' },
    { label: 'WhatsApp Failed', value: stats.failedWhatsappSessions, icon: AlertTriangle, bgGradient: 'from-amber-100 to-amber-50', textGradient: 'from-amber-600 to-amber-800', text: 'text-amber-600' },
    { label: 'AI Tokens (Bulan Ini)', value: stats.totalAiUsage.toLocaleString(), icon: Zap, bgGradient: 'from-violet-100 to-violet-50', textGradient: 'from-violet-600 to-violet-800', text: 'text-violet-600' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent flex items-center gap-3">
          Overview
        </h1>
        <p className="text-slate-500 font-medium text-lg">Metrik dan performa global ChatBisnis AI Suite.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {cards.map((card) => (
          <div key={card.label} className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 hover:shadow-xl hover:-translate-y-1 hover:shadow-indigo-100/50 transition-all duration-300 group">
            <div className="flex items-center gap-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${card.bgGradient} group-hover:scale-110 transition-transform`}>
                <card.icon className={`w-7 h-7 ${card.text}`} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500">{card.label}</p>
                <h3 className={`text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${card.textGradient} tracking-tight`}>{card.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
