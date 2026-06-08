'use client';

import { useEffect, useState } from 'react';
import { Users, MessageSquare, Database, Server } from 'lucide-react';
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

  if (loading) return <div>Memuat data overview...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Users</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.totalUsers}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Chats Today</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.totalChatsToday}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-lg text-purple-600">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Leads</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.totalLeads}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="bg-amber-100 p-3 rounded-lg text-amber-600">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Active WAHA Sessions</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.activeWahaSessions}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
