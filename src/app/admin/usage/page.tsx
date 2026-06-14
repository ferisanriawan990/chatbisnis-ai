'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Activity, Search } from 'lucide-react';

interface Usage {
  id: string;
  userId: string;
  date: string;
  month: string;
  aiChats: number;
  aiTokens: number;
  whatsappMessages: number;
  user: {
    name: string;
    email: string;
  };
}

export default function AdminUsagePage() {
  const [usages, setUsages] = useState<Usage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsages = async () => {
    try {
      const res = await fetch('/api/admin/usage');
      if (!res.ok) throw new Error('Failed to fetch usages');
      const data = await res.json();
      setUsages(data);
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsages();
  }, []);

  const filteredUsages = usages.filter(u => 
    u.user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.month.includes(searchTerm)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-lg p-8 rounded-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20">
              <Activity className="w-8 h-8 text-white" />
            </div>
            Usage Monitoring
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-lg ml-14">Pantau penggunaan AI dan WhatsApp per user</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 space-y-6 relative overflow-hidden group/list">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-100/50 to-transparent rounded-bl-full pointer-events-none transition-transform duration-500 group-hover/list:scale-110"></div>
        <div className="flex gap-4 items-center border-b border-slate-100/50 pb-6 relative z-10">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari user atau bulan (YYYY-MM)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white/50 border border-slate-200/60 rounded-2xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all focus:bg-white shadow-sm text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500 font-medium animate-pulse relative z-10">Memuat data...</div>
        ) : (
          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100/50 text-slate-500">
                  <th className="pb-4 px-2 font-bold uppercase tracking-wider text-[11px]">Tanggal</th>
                  <th className="pb-4 px-2 font-bold uppercase tracking-wider text-[11px]">User</th>
                  <th className="pb-4 px-2 font-bold uppercase tracking-wider text-[11px]">Bulan</th>
                  <th className="pb-4 px-2 font-bold uppercase tracking-wider text-[11px] text-right">AI Chats</th>
                  <th className="pb-4 px-2 font-bold uppercase tracking-wider text-[11px] text-right">WA Msgs</th>
                  <th className="pb-4 px-2 font-bold uppercase tracking-wider text-[11px] text-right">Tokens</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {filteredUsages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">
                      Tidak ada data penggunaan
                    </td>
                  </tr>
                ) : (
                  filteredUsages.map(u => (
                    <tr key={u.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="py-5 px-2 text-slate-600 font-bold whitespace-nowrap">
                        <span className="bg-white/60 border border-slate-100 shadow-sm px-2.5 py-1 rounded-md text-[11px]">
                          {new Date(u.date).toLocaleDateString('id-ID')}
                        </span>
                      </td>
                      <td className="py-5 px-2">
                        <div className="text-slate-800 font-extrabold">{u.user.name}</div>
                        <div className="text-slate-500 text-[11px] font-medium mt-0.5">{u.user.email}</div>
                      </td>
                      <td className="py-5 px-2 text-slate-600 whitespace-nowrap">
                        <span className="bg-slate-100 border border-slate-200/50 text-slate-600 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase shadow-sm">
                          {u.month}
                        </span>
                      </td>
                      <td className="py-5 px-2 text-indigo-700 font-black text-right">{u.aiChats.toLocaleString('id-ID')}</td>
                      <td className="py-5 px-2 text-emerald-600 font-black text-right">{u.whatsappMessages.toLocaleString('id-ID')}</td>
                      <td className="py-5 px-2 text-purple-600 font-black text-right">{u.aiTokens.toLocaleString('id-ID')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
