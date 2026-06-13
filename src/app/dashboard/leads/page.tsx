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
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <Toaster position="top-right" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-8 h-8 text-blue-600" />
            Lead Capture
          </h1>
          <p className="text-slate-500 mt-1">Kelola data pelanggan potensial yang berhasil dikumpulkan oleh bot Anda.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Cari nama, nomor, minat, alamat..." 
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
            <option value="cold">Cold</option>
            <option value="warm">Warm</option>
            <option value="hot">Hot</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>
        </div>
      </div>

      {selectedLeads.length > 0 && (
        <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl shadow-sm border border-blue-100 animate-in fade-in slide-in-from-bottom-2">
          <div className="text-sm font-bold text-blue-800">
            {selectedLeads.length} pelanggan dipilih
          </div>
          <button 
            onClick={() => setIsBroadcastModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md flex items-center gap-2"
          >
            Kirim Broadcast / Follow-up
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <th className="px-6 py-4 w-10">
                  <input type="checkbox" onChange={toggleSelectAll} checked={leads.length > 0 && selectedLeads.length === leads.length} className="w-4 h-4 text-blue-600 rounded cursor-pointer" />
                </th>
                <th className="px-6 py-4 font-semibold">Pelanggan</th>
                <th className="px-6 py-4 font-semibold">Minat & Budget</th>
                <th className="px-6 py-4 font-semibold">Alamat</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Assigned To</th>
                <th className="px-6 py-4 font-semibold">Notes / Aksi</th>
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
                            <button onClick={handleSaveEdit} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1 rounded text-xs font-medium disabled:opacity-50">
                              Simpan
                            </button>
                            <button onClick={() => setEditingId(null)} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-1 rounded text-xs font-medium">
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1 items-start">
                          <p className="text-xs text-slate-600 line-clamp-2 max-w-xs">{lead.notes || <span className="italic text-slate-400">Tidak ada catatan</span>}</p>
                          <button onClick={() => handleEditClick(lead)} className="text-xs text-blue-600 hover:underline mt-1 font-medium">Edit Status & Note</button>
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
