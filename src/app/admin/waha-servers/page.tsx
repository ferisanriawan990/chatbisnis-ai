
'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Server, Plus, Edit2, PlayCircle, Trash2, X } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';

export default function AdminWahaServersPage() {
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
      const res = await fetch('/api/admin/waha-servers');
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

      const url = editingServer ? `/api/admin/waha-servers/${editingServer.id}` : '/api/admin/waha-servers';
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
      const res = await fetch(`/api/admin/waha-servers/${id}/test`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to test connection');
      toast.success('Koneksi berhasil! Status WAHA online.');
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(error.message);
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/waha-servers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete server');
      toast.success('Server berhasil dihapus');
      fetchServers();
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Server className="w-6 h-6 text-indigo-600" />
            WAHA Servers
          </h1>
          <p className="text-slate-500 mt-1">Kelola instance WhatsApp HTTP API (WAHA) yang melayani traffic chatbot.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Tambah Server
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? <p>Memuat...</p> : servers.map(s => (
          <div key={s.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{s.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
                    {s.currentSessions} / {s.maxSessions} Sessions
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleTest(s.id)} disabled={testingId === s.id} className="text-slate-400 hover:text-emerald-600 transition-colors" title="Test Connection">
                  <PlayCircle className={`w-5 h-5 ${testingId === s.id ? 'animate-pulse text-emerald-600' : ''}`} />
                </button>
                <button onClick={() => handleOpenModal(s)} className="text-slate-400 hover:text-indigo-600 transition-colors" title="Edit Server">
                  <Edit2 className="w-5 h-5" />
                </button>
                <button onClick={() => setDeleteModal({ isOpen: true, serverId: s.id, name: s.name })} className="text-slate-400 hover:text-red-600 transition-colors" title="Delete Server">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="text-sm text-slate-600 space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium min-w-[80px]">Status:</span> 
                <span className={`text-xs font-semibold uppercase ${s.status === 'online' ? 'text-emerald-600' : 'text-amber-600'}`}>{s.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium min-w-[80px]">Base URL:</span> 
                <span className="truncate font-mono text-xs">{s.baseUrl}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium min-w-[80px]">API Key:</span> 
                <span className="font-mono text-xs text-slate-400">{s.hasApiKey ? '•••••••• (Configured)' : 'Not Configured'}</span>
              </div>
              {s.lastHealthCheckAt && (
                <div className="flex items-center gap-2">
                  <span className="font-medium min-w-[80px]">Last Check:</span> 
                  <span className="text-xs text-slate-500">{new Date(s.lastHealthCheckAt).toLocaleString()}</span>
                </div>
              )}
              {s.lastError && (
                <div className="mt-2 p-2 bg-red-50 text-red-700 rounded text-xs">
                  <strong>Error:</strong> {s.lastError}
                </div>
              )}
              {s.notes && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs italic text-slate-500">
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
              <h3 className="text-xl font-bold">{editingServer ? 'Edit WAHA Server' : 'Tambah WAHA Server'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Server</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="Contoh: WAHA Node 1 (SG)" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Base URL</label>
                <input type="url" required value={formData.baseUrl} onChange={e => setFormData({...formData, baseUrl: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="https://waha-node.domainanda.com" />
                {formData.baseUrl && formData.baseUrl.startsWith('http://') && process.env.NODE_ENV === 'production' && (
                  <p className="text-amber-600 text-xs mt-1">⚠️ Peringatan: Gunakan HTTPS di Production untuk keamanan Webhook!</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">API Key {editingServer && '(Kosongkan jika tidak ingin mengubah)'}</label>
                <input type="password" value={formData.apiKey} onChange={e => setFormData({...formData, apiKey: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="waha-secret-key" />
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
        title="Hapus WAHA Server"
        message={`Apakah Anda yakin ingin menghapus server "${deleteModal.name}"?`}
      />
    </div>
  );
}
