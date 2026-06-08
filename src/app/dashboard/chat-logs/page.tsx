'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { MessageSquare } from 'lucide-react';

export default function DashboardChatLogsPage() {
  const [logs, setLogs] = useState<any[]>([]) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/dashboard/chat-logs?limit=50');
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      setLogs(data.logs || []);
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

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-indigo-600" />
          Riwayat Percakapan (Chat Logs)
        </h1>
        <p className="text-slate-500 mt-1">Pantau percakapan chatbot dengan pelanggan Anda (50 terbaru).</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        {loading ? <p>Memuat data...</p> : (
          <div className="space-y-4">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-slate-500">Belum ada percakapan.</div>
            ) : logs.map(log => (
              <div key={log.id} className="p-4 border border-slate-100 rounded-lg bg-slate-50">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-slate-700 bg-white px-2 py-1 border rounded">{log.customerPhone} {log.customerName ? `(${log.customerName})` : ''}</span>
                  <span className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleString('id-ID')}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-100 mb-2">
                  <p className="text-xs text-slate-400 mb-1">Pelanggan:</p>
                  <p className="text-sm text-slate-800">{log.messageIn}</p>
                </div>
                <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs text-indigo-400">Bot ({log.aiUsed || 'Auto'}):</p>
                    {log.needsHuman && <span className="text-xs bg-amber-100 text-amber-700 px-2 rounded">Needs Human</span>}
                  </div>
                  <p className="text-sm text-slate-800">{log.messageOut}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
