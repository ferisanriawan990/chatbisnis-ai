/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface LeadRow {
  id: string;
  customerName?: string;
  customerPhone: string;
  interest?: string;
  budget?: number;
  address?: string;
  status: 'cold' | 'warm' | 'hot' | 'converted' | 'lost';
  notes?: string;
  tags?: string | null;
  leadScore?: number;
  assignedAdminId?: string | null;
  createdAt: string;
}

export default function LeadsPage() {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<LeadRow[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ status: '', notes: '', assignedAdminId: '' });
  const [saving, setSaving] = useState(false);
  
  // Team members
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // Broadcast state
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (search) query.append('search', search);
      if (status !== 'all') query.append('status', status);

      const res = await fetch(`/api/dashboard/leads?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
        setPagination(data.pagination || { total: 0, totalPages: 1 });
      }
    } catch {
      toast.error('Gagal mengambil data leads');
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  const fetchTeamMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/team');
      if (res.ok) {
        const data = await res.json();
        setTeamMembers(data.assignments || []);
      }
    } catch {}
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void fetchLeads(); void fetchTeamMembers(); }, [page, search, status]);

  const handleEditClick = (lead: LeadRow) => {
    setEditingId(lead.id);
    setEditForm({ status: lead.status, notes: lead.notes || '', assignedAdminId: lead.assignedAdminId || '' });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/dashboard/leads/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        toast.success('Lead diperbarui');
        setEditingId(null);
        fetchLeads();
      } else {
        toast.error('Gagal memperbarui lead');
      }
    } catch {
      toast.error('Jaringan bermasalah');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'cold': return 'bg-slate-100 text-slate-700';
      case 'warm': return 'bg-blue-100 text-blue-700';
      case 'hot': return 'bg-amber-100 text-amber-700';
      case 'converted': return 'bg-emerald-100 text-emerald-700';
      case 'lost': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getScoreColor = (score: number | undefined) => {
    if (!score) return 'bg-slate-100 text-slate-500';
    if (score >= 80) return 'bg-rose-100 text-rose-700 font-bold';
    if (score >= 50) return 'bg-amber-100 text-amber-700 font-medium';
    return 'bg-blue-50 text-blue-600';
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedLeads(leads.map(l => l.id));
    else setSelectedLeads([]);
  };

  const toggleSelect = (id: string) => {
    setSelectedLeads(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBroadcast = async () => {
    if (selectedLeads.length === 0 || !broadcastMessage.trim()) return;
    setBroadcasting(true);
    toast.loading('Mengirim pesan...', { id: 'broadcast' });
    try {
      const res = await fetch('/api/dashboard/leads/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: selectedLeads, messageText: broadcastMessage })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Berhasil mengirim ${data.successCount} pesan. Gagal: ${data.failCount}`, { id: 'broadcast' });
        setIsBroadcastModalOpen(false);
        setBroadcastMessage('');
        setSelectedLeads([]);
      } else {
        toast.error(data.error || 'Gagal mengirim pesan', { id: 'broadcast' });
      }
    } catch {
      toast.error('Jaringan bermasalah', { id: 'broadcast' });
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 p-4 md:p-8 animate-in fade-in duration-700">
      <Toaster position="top-right" />
      
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-lg p-8 rounded-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 via-emerald-900 to-slate-900 bg-clip-text text-transparent flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl shadow-lg shadow-emerald-500/20">
              <Users className="w-8 h-8 text-white" />
            </div>
            Lead CRM
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-lg ml-14">Kelola data pelanggan potensial yang berhasil dikumpulkan oleh bot Anda.</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
        <div className="relative md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Cari nama, nomor, minat, alamat..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm font-semibold text-slate-700 transition-all shadow-sm focus:bg-white"
          />
        </div>
        <div>
          <select 
            value={status} 
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm font-semibold text-slate-700 bg-slate-50/80 hover:bg-white transition-all shadow-sm appearance-none cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="cold">Cold</option>
            <option value="warm">Warm</option>
            <option value="hot">Hot</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>
        </div>
      </div>

      {selectedLeads.length > 0 && (
        <div className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl shadow-sm border border-blue-100 animate-in fade-in slide-in-from-bottom-2 relative z-10">
          <div className="text-lg font-extrabold text-blue-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              {selectedLeads.length}
            </div>
            pelanggan dipilih
          </div>
          <button 
            onClick={() => setIsBroadcastModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/40 hover:-translate-y-0.5 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
          >
            Kirim Broadcast / Follow-up
          </button>
        </div>
      )}

      <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 relative overflow-hidden group/list z-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-100/50 to-transparent rounded-bl-full pointer-events-none transition-transform duration-500 group-hover/list:scale-110"></div>
        <div className="overflow-x-auto relative z-10 custom-scrollbar p-2">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-[11px] font-extrabold text-slate-500 uppercase border-b border-slate-100 tracking-wider">
              <tr>
                <th className="px-6 py-5 w-10">
                  <input type="checkbox" onChange={toggleSelectAll} checked={leads.length > 0 && selectedLeads.length === leads.length} className="w-4 h-4 text-emerald-600 rounded cursor-pointer border-slate-300 focus:ring-emerald-500" />
                </th>
                <th className="px-6 py-5">Pelanggan</th>
                <th className="px-6 py-5">Minat & Budget</th>
                <th className="px-6 py-5">Alamat</th>
                <th className="px-6 py-5">AI Score & Tags</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Assigned To</th>
                <th className="px-6 py-5 w-1/4">Notes / Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 animate-pulse">Memuat data...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-500">Tidak ada lead ditemukan.</td></tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${selectedLeads.includes(lead.id) ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-6 py-4">
                      <input type="checkbox" checked={selectedLeads.includes(lead.id)} onChange={() => toggleSelect(lead.id)} className="w-4 h-4 text-blue-600 rounded cursor-pointer" />
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{lead.customerName || 'Tanpa Nama'}</p>
                      <p className="text-xs text-slate-500">{lead.customerPhone}</p>
                      <p className="text-xs text-slate-400 mt-1">{new Date(lead.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{lead.interest || '-'}</p>
                      <p className="text-xs text-slate-500">{lead.budget ? `Rp ${lead.budget.toLocaleString('id-ID')}` : '-'}</p>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">{lead.address || '-'}</td>
                    
                    {/* Score & Tags Column */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        {lead.leadScore ? (
                          <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs max-w-max shadow-sm border border-white ${getScoreColor(lead.leadScore)}`}>
                            Score: {lead.leadScore}/100
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Belum disekor</span>
                        )}
                        {lead.tags && (
                          <div className="flex flex-wrap gap-1">
                            {lead.tags.split(',').map((tag, i) => (
                              <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[10px] uppercase font-medium tracking-wide">
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status Column */}
                    <td className="px-6 py-4">
                      {editingId === lead.id ? (
                        <select 
                          value={editForm.status} 
                          onChange={(e) => setEditForm(p => ({ ...p, status: e.target.value }))}
                          className="w-full p-1 text-sm border rounded"
                        >
                          <option value="cold">Cold</option>
                          <option value="warm">Warm</option>
                          <option value="hot">Hot</option>
                          <option value="converted">Converted</option>
                          <option value="lost">Lost</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs uppercase font-semibold ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      )}
                    </td>

                    {/* Assigned To Column */}
                    <td className="px-6 py-4">
                      {editingId === lead.id ? (
                        <select 
                          value={editForm.assignedAdminId} 
                          onChange={(e) => setEditForm(p => ({ ...p, assignedAdminId: e.target.value }))}
                          className="w-full p-1 text-sm border rounded"
                        >
                          <option value="">-- Unassigned --</option>
                          {teamMembers.map(t => (
                            <option key={t.user.id} value={t.user.id}>{t.user.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-slate-700">
                          {lead.assignedAdminId 
                            ? teamMembers.find(t => t.user.id === lead.assignedAdminId)?.user?.name || 'Assigned' 
                            : <span className="italic text-slate-400">Unassigned</span>}
                        </span>
                      )}
                    </td>

                    {/* Notes & Actions Column */}
                    <td className="px-6 py-4">
                      {editingId === lead.id ? (
                        <div className="flex flex-col gap-2">
                          <textarea 
                            value={editForm.notes} 
                            onChange={(e) => setEditForm(p => ({ ...p, notes: e.target.value }))}
                            className="w-full p-2 text-xs border rounded resize-none"
                            rows={2}
                            placeholder="Catatan..."
                          ></textarea>
                          <div className="flex gap-2">
                            <button onClick={handleSaveEdit} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded shadow-sm disabled:opacity-50 text-xs font-semibold">
                              {saving ? 'Menyimpan...' : 'Simpan'}
                            </button>
                            <button onClick={() => setEditingId(null)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded shadow-sm text-xs font-semibold">
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <p className="text-xs text-slate-600 line-clamp-3 bg-yellow-50/50 p-2 rounded border border-yellow-100/50 min-h-[2.5rem]">
                            {lead.notes || <span className="italic text-slate-400">Tidak ada catatan internal.</span>}
                          </p>
                          <button 
                            onClick={() => handleEditClick(lead)}
                            className="self-start text-blue-600 hover:text-blue-800 text-xs font-semibold px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
                          >
                            Edit Lead
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-4">
          <button 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
            className="p-2 bg-white border rounded hover:bg-slate-50 disabled:opacity-50 shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-slate-600">
            Halaman {page} dari {pagination.totalPages}
          </span>
          <button 
            disabled={page === pagination.totalPages} 
            onClick={() => setPage(p => p + 1)}
            className="p-2 bg-white border rounded hover:bg-slate-50 disabled:opacity-50 shadow-sm"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Kirim Pesan Broadcast</h3>
            <p className="text-sm text-slate-500 mb-4">Pesan akan dikirim ke <span className="font-bold text-slate-700">{selectedLeads.length}</span> pelanggan. Gunakan tag <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-600 font-bold">{"{{name}}"}</code> untuk menyebut nama pelanggan secara otomatis.</p>
            <textarea 
              rows={5}
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              className="w-full p-4 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none resize-none mb-4 text-sm font-medium text-slate-700 shadow-sm"
              placeholder="Halo {{name}}, kami ada promo spesial hari ini khusus untuk Kakak! Balas pesan ini jika berminat ya..."
            ></textarea>
            <div className="flex justify-end gap-3 mt-2">
              <button onClick={() => setIsBroadcastModalOpen(false)} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all">Batal</button>
              <button onClick={handleBroadcast} disabled={broadcasting || !broadcastMessage.trim()} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg disabled:opacity-50 transition-all shadow-sm">
                {broadcasting ? 'Mengirim...' : 'Kirim Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
