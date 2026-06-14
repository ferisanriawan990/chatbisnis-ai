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
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'blue', bg: 'bg-blue-50', text: 'text-blue-600' },
    { label: 'Bot Aktif', value: stats.activeUsers, icon: UserCheck, color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'Chat Hari Ini', value: stats.totalChatsToday, icon: MessageSquare, color: 'indigo', bg: 'bg-indigo-50', text: 'text-indigo-600' },
    { label: 'Chat Bulan Ini', value: stats.totalChatsThisMonth, icon: Activity, color: 'purple', bg: 'bg-purple-50', text: 'text-purple-600' },
    { label: 'Total Leads', value: stats.totalLeads, icon: Database, color: 'cyan', bg: 'bg-cyan-50', text: 'text-cyan-600' },
    { label: 'WhatsApp Connected', value: stats.activeWhatsappSessions, icon: Server, color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'WhatsApp Failed', value: stats.failedWhatsappSessions, icon: AlertTriangle, color: 'amber', bg: 'bg-amber-50', text: 'text-amber-600' },
    { label: 'AI Tokens (Bulan Ini)', value: stats.totalAiUsage.toLocaleString(), icon: Zap, color: 'violet', bg: 'bg-violet-50', text: 'text-violet-600' },
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
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-${card.color}-100 to-${card.color}-50 group-hover:scale-110 transition-transform`}>
                <card.icon className={`w-7 h-7 ${card.text}`} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500">{card.label}</p>
                <h3 className={`text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-${card.color}-600 to-${card.color}-800 tracking-tight`}>{card.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
