/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Key, Plus, Trash2, Bot, Save } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import InputModal from '@/components/InputModal';

export default function AdminApiKeysPage() {
  const [keys, setKeys] = useState<any[]>([]) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);
  const [globalModel, setGlobalModel] = useState('gpt-4o-mini');
  const [savingModel, setSavingModel] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    key: '',
    value: '',
    provider: 'flaz',
    description: '',
  });

  const [modalState, setModalState] = useState<{
    type: 'delete' | 'rotate' | 'desc' | null;
    targetId: string | null;
    currentValue?: string;
  }>({ type: null, targetId: null });

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/admin/api-keys', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch API keys');
      const data = await res.json();
      setKeys(data.filter((k: any) => k.key !== 'GLOBAL_AI_MODEL')); // eslint-disable-line @typescript-eslint/no-explicit-any
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalModel = async () => {
    try {
      const res = await fetch('/api/admin/global-ai-model', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.model) setGlobalModel(data.model);
      }
    } catch (error) {
      console.error('Failed to fetch global model:', error);
    }
  };

  useEffect(() => {
    fetchKeys();
    fetchGlobalModel();
  }, []);

  const handleSaveModel = async () => {
    setSavingModel(true);
    toast.loading('Menyimpan model AI...', { id: 'model' });
    try {
      const res = await fetch('/api/admin/global-ai-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: globalModel })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Gagal menyimpan model AI');
      }
      toast.success('Model AI global berhasil disimpan', { id: 'model' });
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(e.message, { id: 'model' });
    } finally {
      setSavingModel(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.loading('Menyimpan API Key...', { id: 'add' });
    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Gagal menyimpan API Key');
      }
      toast.success('API Key berhasil disimpan', { id: 'add' });
      setFormData({ name: '', key: '', value: '', provider: 'flaz', description: '' });
    fetchKeys();
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(e.message, { id: 'add' });
    }
  };

  const handleDelete = async (id: string) => {
    toast.loading('Menghapus...', { id: 'del' });
    try {
      const res = await fetch(`/api/admin/api-keys/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus API Key');
      toast.success('API Key dihapus', { id: 'del' });
      fetchKeys();
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(e.message, { id: 'del' });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    toast.loading('Memperbarui status...', { id: 'status' });
    try {
      const res = await fetch(`/api/admin/api-keys/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Gagal memperbarui status');
      }
      toast.success('Status diperbarui', { id: 'status' });
      fetchKeys();
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(e.message, { id: 'status' });
    }
  };

  const handleRotateKey = async (id: string, newValue: string) => {
    toast.loading('Merotasi Key...', { id: 'rotate' });
    try {
      const res = await fetch(`/api/admin/api-keys/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: newValue })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Gagal merotasi Key');
      }
      toast.success('Key berhasil dirotasi', { id: 'rotate' });
      fetchKeys();
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(e.message, { id: 'rotate' });
    }
  };

  const handleEditDescription = async (id: string, newDesc: string) => {
    toast.loading('Memperbarui deskripsi...', { id: 'desc' });
    try {
      const res = await fetch(`/api/admin/api-keys/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: newDesc })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Gagal memperbarui deskripsi');
      }
      toast.success('Deskripsi diperbarui', { id: 'desc' });
      fetchKeys();
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(e.message, { id: 'desc' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Key className="w-6 h-6 text-indigo-600" />
          Global API Keys
        </h1>
        <p className="text-slate-500 mt-1">Kelola API key global untuk layanan AI Flaz Cloud.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-600" /> Model AI Global
            </h2>
            <p className="text-sm text-slate-500">
              Pilih model AI yang akan digunakan saat menggunakan Global API Key.
            </p>
            <div>
              <label className="block text-sm font-medium mb-1">Pilih Model AI</label>
              <select
                value={globalModel}
                onChange={e => setGlobalModel(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                <option value="claude-haiku-4-5">Claude Haiku 4.5</option>
                <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
                <option value="llama-3.1-70b-instruct">Llama 3.1 70B</option>
              </select>
            </div>
            <button 
              onClick={handleSaveModel}
              disabled={savingModel}
              className="w-full bg-slate-900 text-white py-2 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Simpan Model
            </button>
          </div>

          <form onSubmit={handleAdd} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Tambah API Key</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Nama</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Flaz Production" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Key Identifier</label>
              <input required type="text" value={formData.key} onChange={e => setFormData({...formData, key: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. FLAZ_API_KEY_GLOBAL" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Secret Value</label>
              <input required type="password" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="sk-..." />
            </div>
            <div className="hidden">
              <label className="block text-sm font-medium mb-1">Provider</label>
              <select value={formData.provider} onChange={e => setFormData({...formData, provider: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="flaz">Flaz Cloud</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Deskripsi (Opsional)</label>
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Digunakan untuk engine utama" rows={2} />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Simpan Key
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            {loading ? <p>Memuat...</p> : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-3 font-medium">Nama & Identifier</th>
                    <th className="pb-3 font-medium">Provider</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {keys.length === 0 && <tr><td colSpan={4} className="py-4 text-center">Belum ada API Key tersimpan</td></tr>}
                  {keys.map(k => (
                    <tr key={k.id}>
                      <td className="py-4">
                        <div className="font-medium text-slate-900">{k.name}</div>
                        <div className="font-mono text-xs text-slate-500 mt-1">{k.key}</div>
                        {k.description && <div className="text-xs text-slate-500 mt-1 italic">{k.description}</div>}
                        {k.lastRotatedAt && <div className="text-xs text-emerald-600 mt-1">Rotated: {new Date(k.lastRotatedAt).toLocaleDateString()}</div>}
                      </td>
                      <td className="py-4">
                        <span className="capitalize bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs">{k.provider}</span>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-md text-xs ${k.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {k.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-4 text-right flex items-center justify-end gap-2">
                        <button onClick={() => handleToggleStatus(k.id, k.isActive)} className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded font-medium">
                          {k.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button onClick={() => setModalState({ type: 'rotate', targetId: k.id })} className="text-xs px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded font-medium">
                          Rotate
                        </button>
                        <button onClick={() => setModalState({ type: 'desc', targetId: k.id, currentValue: k.description })} className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded font-medium">
                          Edit Desc
                        </button>
                        <button onClick={() => setModalState({ type: 'delete', targetId: k.id })} className="text-red-500 p-1 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      
      <ConfirmModal
        isOpen={modalState.type === 'delete'}
        onClose={() => setModalState({ type: null, targetId: null })}
        onConfirm={() => { if (modalState.targetId) handleDelete(modalState.targetId); }}
        title="Hapus API Key"
        message="Yakin ingin menghapus API Key ini? Layanan yang menggunakannya mungkin akan berhenti berfungsi."
      />

      <InputModal
        isOpen={modalState.type === 'rotate'}
        onClose={() => setModalState({ type: null, targetId: null })}
        onSubmit={(val) => { if (modalState.targetId) handleRotateKey(modalState.targetId, val); }}
        title="Rotate API Key"
        message="Masukkan Secret Value baru untuk API Key ini:"
        inputType="password"
      />

      <InputModal
        isOpen={modalState.type === 'desc'}
        onClose={() => setModalState({ type: null, targetId: null })}
        onSubmit={(val) => { if (modalState.targetId) handleEditDescription(modalState.targetId, val); }}
        title="Edit Deskripsi"
        message="Masukkan deskripsi baru:"
        defaultValue={modalState.currentValue || ''}
      />
    </div>
  );
}
