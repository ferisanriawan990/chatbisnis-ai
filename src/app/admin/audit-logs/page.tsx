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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-600" />
            Audit Logs
          </h1>
          <p className="text-slate-500 mt-1">Jejak aktivitas admin dan sistem keamanan</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-6">
        <div className="flex gap-4 items-center border-b border-slate-100 pb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari aktivitas, admin, atau entitas..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-500">Memuat data log...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 font-medium">Tanggal</th>
                  <th className="pb-3 font-medium">Aktivitas</th>
                  <th className="pb-3 font-medium">Admin</th>
                  <th className="pb-3 font-medium">Entitas</th>
                  <th className="pb-3 font-medium">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Tidak ada jejak audit
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 text-slate-500 whitespace-nowrap">
                        {new Date(l.createdAt).toLocaleString('id-ID')}
                      </td>
                      <td className="py-4">
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-xs font-semibold uppercase">
                          {l.action}
                        </span>
                      </td>
                      <td className="py-4">
                        {l.actorUser ? (
                          <>
                            <div className="text-slate-900 font-medium">{l.actorUser.name}</div>
                            <div className="text-slate-500 text-xs">{l.actorUser.email}</div>
                          </>
                        ) : (
                          <span className="text-slate-400 italic">System</span>
                        )}
                      </td>
                      <td className="py-4 text-slate-600">
                        {l.entityType} <br/>
                        <span className="text-xs text-slate-400 truncate max-w-[150px] inline-block">{l.entityId}</span>
                      </td>
                      <td className="py-4 text-slate-500 font-mono text-xs">{l.ipAddress || '-'}</td>
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
