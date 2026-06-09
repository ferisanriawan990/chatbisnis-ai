/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Search, ShieldAlert, Bot, ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface ChatLogRow {
  id: string;
  customerPhone: string;
  customerName?: string;
  messageIn: string;
  messageOut?: string;
  status: 'success' | 'failed';
  needsHuman: boolean;
  tokenUsage?: number;
  createdAt: string;
  chatbotSettingId: string;
  metadataJson?: string | null;
}

export default function ChatLogsPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<ChatLogRow[]>([]);
  const [states, setStates] = useState<Record<string, string>>({});

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [needsHuman, setNeedsHuman] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (search) query.append('search', search);
      if (status !== 'all') query.append('status', status);
      if (needsHuman !== 'all') query.append('needsHuman', needsHuman);

      const res = await fetch(`/api/dashboard/chat-logs?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setStates(data.states || {});
        setPagination(data.pagination || { total: 0, totalPages: 1 });
      }
    } catch {
      toast.error('Gagal mengambil logs');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, needsHuman]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void fetchLogs(); }, [page, search, status, needsHuman]);

  const handleResetHandover = async (customerPhone: string, chatbotSettingId: string) => {
    try {
      const res = await fetch('/api/dashboard/conversations/reset-handover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerPhone, chatbotSettingId }),
      });
      if (res.ok) {
        toast.success(`AI diaktifkan kembali untuk ${customerPhone}`);
        fetchLogs();
      } else {
        toast.error('Gagal mereset state');
      }
    } catch {
      toast.error('Jaringan bermasalah');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <Toaster position="top-right" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            Chat Logs
          </h1>
          <p className="text-slate-500 mt-1">Pantau seluruh percakapan bot dengan pelanggan.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari pesan atau nomor..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div>
          <select
            value={needsHuman}
            onChange={(e) => { setNeedsHuman(e.target.value); setPage(1); }}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Semua Percakapan</option>
            <option value="true">Butuh Admin (Handover)</option>
            <option value="false">Dibalas AI</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 animate-pulse font-medium">Memuat Logs...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-100 text-slate-500">Tidak ada percakapan ditemukan.</div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => {
            const isHandover = states[log.customerPhone] === 'human_handover' || log.needsHuman;

            return (
              <div key={log.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-3 mb-3 gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-800">{log.customerPhone}</span>
                    <span className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
                    {log.status === 'success' ? (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">Success</span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Failed</span>
                    )}
                    {isHandover && (
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> Butuh Admin
                      </span>
                    )}
                  </div>

                  {isHandover && (
                    <button
                      onClick={() => handleResetHandover(log.customerPhone, log.chatbotSettingId)}
                      className="text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
                    >
                      <RefreshCcw className="w-3 h-3" /> Aktifkan AI Lagi
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-400 font-medium mb-1">Masuk</p>
                    <p className="text-sm text-slate-700">{log.messageIn}</p>
                  </div>

                  {log.messageOut && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-xs text-blue-400 font-medium flex items-center gap-1"><Bot className="w-3 h-3" /> Balasan AI</p>
                        {log.metadataJson && (
                          <div className="flex gap-2">
                            {(() => {
                              try {
                                const meta = JSON.parse(log.metadataJson);
                                return (
                                  <>
                                    {meta.intent && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-[10px] uppercase font-bold border border-blue-200">Intent: {meta.intent}</span>}
                                    {meta.promptSource && <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded text-[10px] uppercase font-bold border border-indigo-200">Src: {meta.promptSource}</span>}
                                    {meta.knowledgeMatchCount !== undefined && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded text-[10px] uppercase font-bold border border-purple-200">KB: {meta.knowledgeMatchCount}</span>}
                                    {meta.usedCatalogUrl && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded text-[10px] uppercase font-bold border border-emerald-200">Catalog</span>}
                                  </>
                                );
                              } catch { return null; }
                            })()}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-slate-700">{log.messageOut}</p>
                      {(log.tokenUsage ?? 0) > 0 && <p className="text-xs text-blue-300 mt-2 text-right">{log.tokenUsage} tokens</p>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="p-2 bg-white border rounded hover:bg-slate-50 disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-slate-600">
            Halaman {page} dari {pagination.totalPages}
          </span>
          <button
            disabled={page === pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="p-2 bg-white border rounded hover:bg-slate-50 disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
