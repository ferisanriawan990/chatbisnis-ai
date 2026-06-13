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
    activeWahaSessions: 0,
    failedWahaSessions: 0,
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
    { label: 'WhatsApp Connected', value: stats.activeWahaSessions, icon: Server, color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'WhatsApp Failed', value: stats.failedWahaSessions, icon: AlertTriangle, color: 'amber', bg: 'bg-amber-50', text: 'text-amber-600' },
    { label: 'AI Tokens (Bulan Ini)', value: stats.totalAiUsage.toLocaleString(), icon: Zap, color: 'violet', bg: 'bg-violet-50', text: 'text-violet-600' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card) => (
          <div key={card.label} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center gap-4">
              <div className={`${card.bg} p-3 rounded-xl ${card.text}`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">{card.label}</p>
                <h3 className="text-2xl font-bold text-slate-900">{card.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
