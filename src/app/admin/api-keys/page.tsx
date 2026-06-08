'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Key, Plus, Trash2 } from 'lucide-react';

export default function AdminApiKeysPage() {
  const [keys, setKeys] = useState<any[]>([]) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    key: '',
    value: '',
    provider: 'flaz',
  });

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/admin/api-keys');
      if (!res.ok) throw new Error('Failed to fetch API keys');
      const data = await res.json();
      setKeys(data);
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchKeys();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.loading('Menyimpan API Key...', { id: 'add' });
    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Gagal menyimpan API Key');
      toast.success('API Key berhasil disimpan', { id: 'add' });
      setFormData({ name: '', key: '', value: '', provider: 'flaz' });
      // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchKeys();
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(e.message, { id: 'add' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus API Key ini? Layanan yang menggunakannya mungkin akan berhenti berfungsi.')) return;
    toast.loading('Menghapus...', { id: 'del' });
    try {
      const res = await fetch(`/api/admin/api-keys/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus API Key');
      toast.success('API Key dihapus', { id: 'del' });
      // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchKeys();
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(e.message, { id: 'del' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Key className="w-6 h-6 text-indigo-600" />
          Global API Keys
        </h1>
        <p className="text-slate-500 mt-1">Kelola API key global untuk layanan eksternal (Flaz AI, OpenAI, dll).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
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
            <div>
              <label className="block text-sm font-medium mb-1">Provider</label>
              <select value={formData.provider} onChange={e => setFormData({...formData, provider: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="flaz">Flaz Cloud</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
              </select>
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
                      </td>
                      <td className="py-4">
                        <span className="capitalize bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs">{k.provider}</span>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-md text-xs ${k.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {k.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button onClick={() => handleDelete(k.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg">
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
    </div>
  );
}
