
'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Server, Plus, Edit2, PlayCircle, Trash2, X } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';

export default function AdminWhatsappServersPage() {
  const [servers, setServers] = useState<any[]>([]) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [formData, setFormData] = useState({
    name: '', baseUrl: '', apiKey: '', maxSessions: 50, notes: '', isActive: true
  });
  const [testingId, setTestingId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; serverId: string; name: string }>({ isOpen: false, serverId: '', name: '' });

  const fetchServers = async () => {
    try {
      const res = await fetch('/api/admin/whatsapp-servers');
      if (!res.ok) throw new Error('Failed to fetch servers');
      const data = await res.json();
      setServers(data);
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchServers();
  }, []);

  const handleOpenModal = (srv: any = null) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (srv) {
      setEditingServer(srv);
      setFormData({ ...srv, apiKey: '' }); // don't load cipher
    } else {
      setEditingServer(null);
      setFormData({ name: '', baseUrl: '', apiKey: '', maxSessions: 50, notes: '', isActive: true });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!editingServer && !formData.apiKey) {
        throw new Error('API Key wajib diisi untuk server baru');
      }

      const url = editingServer ? `/api/admin/whatsapp-servers/${editingServer.id}` : '/api/admin/whatsapp-servers';
      const method = editingServer ? 'PATCH' : 'POST';
      
      const payload: Record<string, unknown> = { ...formData, maxSessions: Number(formData.maxSessions) };
      if (editingServer && !payload.apiKey) {
        delete payload.apiKey;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save server');
      
      toast.success(`Server berhasil ${editingServer ? 'diperbarui' : 'dibuat'}`);
      setIsModalOpen(false);
      fetchServers();
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(error.message);
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const res = await fetch(`/api/admin/whatsapp-servers/${id}/test`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to test connection');
      toast.success('Koneksi berhasil! Status Gateway online.');
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(error.message);
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/whatsapp-servers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete server');
      toast.success('Server berhasil dihapus');
      fetchServers();
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-lg p-8 rounded-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 via-emerald-900 to-slate-900 bg-clip-text text-transparent flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/20">
              <Server className="w-8 h-8 text-white" />
            </div>
            WhatsApp Servers
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-lg ml-14">Kelola instance WhatsApp Gateway yang melayani traffic chatbot.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="relative z-10 flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-xl shadow-emerald-500/30 hover:scale-105"
        >
          <Plus className="w-5 h-5" /> Tambah Server
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        {loading ? (
          <div className="col-span-2 flex justify-center py-12 text-slate-500 animate-pulse font-medium">Memuat data server...</div>
        ) : servers.map(s => (
          <div key={s.id} className="bg-white/80 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 flex flex-col group hover:shadow-2xl hover:-translate-y-1 hover:shadow-emerald-500/10 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-100/50 to-transparent rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110"></div>
            
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">{s.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border ${s.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' : 'bg-slate-50 text-slate-500 border-slate-200/50'}`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold bg-white/60 backdrop-blur-sm border border-slate-200/50 shadow-sm px-2.5 py-1 rounded-full">
                    {s.currentSessions} / {s.maxSessions} Sessions
                  </span>
                </div>
              </div>
              <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleTest(s.id)} disabled={testingId === s.id} className="bg-white/80 p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors shadow-sm border border-slate-100" title="Test Connection">
                  <PlayCircle className={`w-5 h-5 ${testingId === s.id ? 'animate-pulse text-emerald-600' : ''}`} />
                </button>
                <button onClick={() => handleOpenModal(s)} className="bg-white/80 p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm border border-slate-100" title="Edit Server">
                  <Edit2 className="w-5 h-5" />
                </button>
                <button onClick={() => setDeleteModal({ isOpen: true, serverId: s.id, name: s.name })} className="bg-white/80 p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shadow-sm border border-slate-100" title="Delete Server">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="text-sm font-medium text-slate-600 flex-1 space-y-3 relative z-10 bg-slate-50/50 rounded-2xl p-5 border border-slate-100/50">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Status</span> 
                <span className={`text-[11px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${s.status === 'online' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{s.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Base URL</span> 
                <span className="truncate font-mono text-[11px] bg-white px-2 py-1 rounded shadow-sm border border-slate-200">{s.baseUrl}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">API Key</span> 
                <span className="font-mono text-[11px] text-slate-500 bg-white px-2 py-1 rounded shadow-sm border border-slate-200">{s.hasApiKey ? '•••••••• (Configured)' : 'Not Configured'}</span>
              </div>
              {s.lastHealthCheckAt && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Last Check</span> 
                  <span className="text-xs text-slate-600 font-semibold">{new Date(s.lastHealthCheckAt).toLocaleString('id-ID')}</span>
                </div>
              )}
              {s.lastError && (
                <div className="mt-4 p-3 bg-rose-50/80 border border-rose-100 text-rose-700 rounded-xl text-xs font-semibold">
                  <span className="block text-rose-900 mb-1 font-bold">Error:</span> {s.lastError}
                </div>
              )}
              {s.notes && (
                <div className="mt-4 p-4 bg-white/60 border border-slate-200/60 rounded-xl text-xs italic text-slate-500 shadow-sm">
                  {s.notes}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold">{editingServer ? 'Edit WhatsApp Server' : 'Tambah WhatsApp Server'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Server</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="Contoh: Gateway Node 1 (SG)" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Base URL</label>
                <input type="url" required value={formData.baseUrl} onChange={e => setFormData({...formData, baseUrl: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="https://whatsapp-node.domainanda.com" />
                {formData.baseUrl && formData.baseUrl.startsWith('http://') && process.env.NODE_ENV === 'production' && (
                  <p className="text-amber-600 text-xs mt-1">⚠️ Peringatan: Gunakan HTTPS di Production untuk keamanan Webhook!</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">API Key {editingServer && '(Kosongkan jika tidak ingin mengubah)'}</label>
                <input type="password" value={formData.apiKey} onChange={e => setFormData({...formData, apiKey: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="whatsapp-secret-key" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Sessions</label>
                  <input type="number" required value={formData.maxSessions} onChange={e => setFormData({...formData, maxSessions: Number(e.target.value)})} className="w-full p-2 border border-slate-200 rounded-lg" />
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                  <label className="text-sm font-medium text-slate-700">Server Aktif</label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Catatan Tambahan</label>
                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-sm" rows={2} />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium">Batal</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={() => handleDelete(deleteModal.serverId)}
        title="Hapus WhatsApp Server"
        message={`Apakah Anda yakin ingin menghapus server "${deleteModal.name}"?`}
      />
    </div>
  );
}
