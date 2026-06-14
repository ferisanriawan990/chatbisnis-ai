'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { History, Search } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress: string;
  createdAt: string;
  actorUser: {
    name: string;
    email: string;
  } | null;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit-logs');
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      setLogs(data);
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.actorUser?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.actorUser?.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-lg p-8 rounded-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-slate-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-slate-600 rounded-2xl shadow-lg shadow-indigo-500/20">
              <History className="w-8 h-8 text-white" />
            </div>
            Audit Logs
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-lg ml-14">Jejak aktivitas admin dan sistem keamanan</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 space-y-6 relative overflow-hidden group/list">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-slate-100/50 to-transparent rounded-bl-full pointer-events-none transition-transform duration-500 group-hover/list:scale-110"></div>
        <div className="flex gap-4 items-center border-b border-slate-100/50 pb-6 relative z-10">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari aktivitas, admin, atau entitas..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white/50 border border-slate-200/60 rounded-2xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all focus:bg-white shadow-sm text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500 font-medium animate-pulse relative z-10">Memuat data log...</div>
        ) : (
          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100/50 text-slate-500">
                  <th className="pb-4 px-2 font-bold uppercase tracking-wider text-[11px]">Tanggal</th>
                  <th className="pb-4 px-2 font-bold uppercase tracking-wider text-[11px]">Aktivitas</th>
                  <th className="pb-4 px-2 font-bold uppercase tracking-wider text-[11px]">Admin</th>
                  <th className="pb-4 px-2 font-bold uppercase tracking-wider text-[11px]">Entitas</th>
                  <th className="pb-4 px-2 font-bold uppercase tracking-wider text-[11px]">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">
                      Tidak ada jejak audit
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-5 px-2 text-slate-500 font-medium whitespace-nowrap">
                        <span className="bg-white/60 border border-slate-100 shadow-sm px-2.5 py-1 rounded-md text-[11px] font-bold">
                          {new Date(l.createdAt).toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="py-5 px-2">
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-100/50 shadow-sm px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                          {l.action}
                        </span>
                      </td>
                      <td className="py-5 px-2">
                        {l.actorUser ? (
                          <>
                            <div className="text-slate-800 font-extrabold">{l.actorUser.name}</div>
                            <div className="text-slate-500 text-[11px] font-medium mt-0.5">{l.actorUser.email}</div>
                          </>
                        ) : (
                          <span className="text-slate-400 italic font-bold">System</span>
                        )}
                      </td>
                      <td className="py-5 px-2 text-slate-600">
                        <div className="font-bold uppercase text-[10px] tracking-wider text-slate-500 mb-0.5">{l.entityType}</div>
                        <span className="text-[11px] font-mono text-slate-400 truncate max-w-[150px] inline-block bg-white/60 px-1.5 py-0.5 rounded border border-slate-100 shadow-sm">{l.entityId}</span>
                      </td>
                      <td className="py-5 px-2 text-slate-400 font-mono text-[11px] font-medium">{l.ipAddress || '-'}</td>
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
