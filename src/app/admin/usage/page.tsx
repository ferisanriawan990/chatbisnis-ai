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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-600" />
            Usage Monitoring
          </h1>
          <p className="text-slate-500 mt-1">Pantau penggunaan AI dan WhatsApp per user</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-6">
        <div className="flex gap-4 items-center border-b border-slate-100 pb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari user atau bulan (YYYY-MM)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-500">Memuat data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 font-medium">Tanggal</th>
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Bulan</th>
                  <th className="pb-3 font-medium text-right">AI Chats</th>
                  <th className="pb-3 font-medium text-right">WA Msgs</th>
                  <th className="pb-3 font-medium text-right">Tokens</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Tidak ada data penggunaan
                    </td>
                  </tr>
                ) : (
                  filteredUsages.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 text-slate-900 font-medium whitespace-nowrap">
                        {new Date(u.date).toLocaleDateString('id-ID')}
                      </td>
                      <td className="py-4">
                        <div className="text-slate-900 font-medium">{u.user.name}</div>
                        <div className="text-slate-500 text-xs">{u.user.email}</div>
                      </td>
                      <td className="py-4 text-slate-600 whitespace-nowrap">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs">
                          {u.month}
                        </span>
                      </td>
                      <td className="py-4 text-slate-900 font-bold text-right">{u.aiChats.toLocaleString('id-ID')}</td>
                      <td className="py-4 text-emerald-600 font-bold text-right">{u.whatsappMessages.toLocaleString('id-ID')}</td>
                      <td className="py-4 text-indigo-600 font-bold text-right">{u.aiTokens.toLocaleString('id-ID')}</td>
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
