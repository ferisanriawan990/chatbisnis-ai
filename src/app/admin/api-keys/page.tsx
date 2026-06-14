/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Key, Plus, Trash2, Bot, Save, CreditCard } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import InputModal from '@/components/InputModal';

export default function AdminApiKeysPage() {
  const [keys, setKeys] = useState<any[]>([]) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);
  const [globalModel, setGlobalModel] = useState('gemini-2.5-flash-lite');
  const [savingModel, setSavingModel] = useState(false);
  const [savingMidtrans, setSavingMidtrans] = useState(false);
  
  const [midtransData, setMidtransData] = useState({
    clientKey: '',
    serverKey: '',
    isProduction: false,
    hasServerKey: false,
  });

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

  const fetchMidtransConfig = async () => {
    try {
      const res = await fetch('/api/admin/midtrans-config', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setMidtransData({
          clientKey: data.clientKey || '',
          serverKey: '', // we don't return plain server key, just placeholder
          isProduction: data.isProduction || false,
          hasServerKey: data.hasServerKey || false,
        });
      }
    } catch (error) {
      console.error('Failed to fetch midtrans config:', error);
    }
  };

  useEffect(() => {
    fetchKeys();
    fetchGlobalModel();
    fetchMidtransConfig();
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

  const handleSaveMidtrans = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMidtrans(true);
    toast.loading('Menyimpan Konfigurasi Midtrans...', { id: 'midtrans' });
    try {
      const res = await fetch('/api/admin/midtrans-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(midtransData)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Gagal menyimpan konfigurasi');
      }
      toast.success('Konfigurasi Midtrans berhasil disimpan', { id: 'midtrans' });
      fetchMidtransConfig();
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(e.message, { id: 'midtrans' });
    } finally {
      setSavingMidtrans(false);
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
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-lg p-8 rounded-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20">
              <Key className="w-8 h-8 text-white" />
            </div>
            Global API Keys
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-lg ml-14">Kelola API key global untuk layanan AI Flaz Cloud.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/80 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 space-y-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-100/50 to-transparent rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110"></div>
            <h2 className="text-xl font-extrabold border-b border-slate-100/50 pb-3 flex items-center gap-3 relative z-10">
              <div className="bg-indigo-50 p-2 rounded-xl border border-indigo-100/50 shadow-sm"><Bot className="w-5 h-5 text-indigo-600" /></div> Model AI Global
            </h2>
            <p className="text-sm font-medium text-slate-500 relative z-10">
              Pilih model AI yang akan digunakan saat menggunakan Global API Key.
            </p>
            <div className="relative z-10">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Pilih Model AI</label>
              <select
                value={globalModel}
                onChange={e => setGlobalModel(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50/80 backdrop-blur-sm border border-slate-200/60 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm focus:bg-white text-slate-700"
              >
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gemini-1.5-flash-8b">Gemini 1.5 Flash 8B</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="claude-3-5-sonnet-20240620">Claude 3.5 Sonnet</option>
                <option value="llama-3.1-70b-instruct">Llama 3.1 70B</option>
              </select>
            </div>
            <button 
              onClick={handleSaveModel}
              disabled={savingModel}
              className="w-full relative z-10 bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 transition-all hover:scale-105"
            >
              <Save className="w-5 h-5" /> Simpan Model
            </button>
          </div>

          <form onSubmit={handleAdd} className="bg-white/80 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 space-y-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-100/50 to-transparent rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110"></div>
            <h2 className="text-xl font-extrabold border-b border-slate-100/50 pb-3 relative z-10 flex items-center gap-3">
               <div className="bg-indigo-50 p-2 rounded-xl border border-indigo-100/50 shadow-sm"><Plus className="w-5 h-5 text-indigo-600" /></div> Tambah API Key
            </h2>
            <div className="relative z-10 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Nama</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700 transition-all focus:bg-white shadow-sm" placeholder="e.g. Flaz Production" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Key Identifier</label>
                <input required type="text" value={formData.key} onChange={e => setFormData({...formData, key: e.target.value})} className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-medium text-sm transition-all focus:bg-white shadow-sm" placeholder="e.g. FLAZ_API_KEY_GLOBAL" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Secret Value</label>
                <input required type="password" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm transition-all focus:bg-white shadow-sm" placeholder="sk-..." />
              </div>
              <div className="hidden">
                <label className="block text-sm font-medium mb-1">Provider</label>
                <select value={formData.provider} onChange={e => setFormData({...formData, provider: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="flaz">Flaz Cloud</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Deskripsi (Opsional)</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-600 transition-all focus:bg-white shadow-sm resize-none" placeholder="e.g. Digunakan untuk engine utama" rows={2} />
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 mt-2">
                <Plus className="w-5 h-5" /> Simpan Key
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveMidtrans} className="bg-white/80 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 space-y-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-100/50 to-transparent rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110"></div>
            <div className="flex justify-between items-center border-b border-slate-100/50 pb-3 relative z-10">
              <h2 className="text-xl font-extrabold flex items-center gap-3">
                <div className="bg-indigo-50 p-2 rounded-xl border border-indigo-100/50 shadow-sm"><CreditCard className="w-5 h-5 text-indigo-600" /></div> Midtrans Payment Gateway
              </h2>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm border uppercase tracking-wider ${midtransData.isProduction ? 'bg-rose-50 text-rose-700 border-rose-100/50' : 'bg-emerald-50 text-emerald-700 border-emerald-100/50'}`}>
                  {midtransData.isProduction ? 'PRODUCTION MODE' : 'SANDBOX MODE'}
                </span>
                <label className="relative inline-flex items-center cursor-pointer shadow-sm rounded-full">
                  <input type="checkbox" checked={midtransData.isProduction} onChange={e => setMidtransData({...midtransData, isProduction: e.target.checked})} className="sr-only peer" />
                  <div className="w-11 h-6 bg-emerald-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                </label>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Client Key</label>
                <input required type="text" value={midtransData.clientKey} onChange={e => setMidtransData({...midtransData, clientKey: e.target.value})} className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm transition-all focus:bg-white shadow-sm" placeholder="SB-Mid-client-..." />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Server Key <span className="text-[10px] font-bold text-slate-400 normal-case ml-1 bg-slate-100 px-1.5 py-0.5 rounded">(Secret)</span></label>
                <input type="password" value={midtransData.serverKey} onChange={e => setMidtransData({...midtransData, serverKey: e.target.value})} required={!midtransData.hasServerKey} className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm transition-all focus:bg-white shadow-sm" placeholder={midtransData.hasServerKey ? "•••••••••••••••••••• (Isi jika ingin ubah)" : "SB-Mid-server-..."} />
              </div>
            </div>
            <button disabled={savingMidtrans} type="submit" className="w-full relative z-10 bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 transition-all hover:scale-105 mt-2 disabled:opacity-50">
              <Save className="w-5 h-5" /> Simpan Konfigurasi Midtrans
            </button>
          </form>

          <div className="bg-white/80 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 relative overflow-hidden group/table">
             <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-100/50 to-transparent rounded-bl-full pointer-events-none transition-transform duration-500 group-hover/table:scale-110"></div>
            {loading ? <p className="text-slate-500 font-medium animate-pulse relative z-10">Memuat...</p> : (
              <div className="overflow-x-auto relative z-10">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100/50 text-slate-500">
                      <th className="pb-4 px-2 font-bold uppercase tracking-wider text-[11px]">Nama & Identifier</th>
                      <th className="pb-4 px-2 font-bold uppercase tracking-wider text-[11px]">Provider</th>
                      <th className="pb-4 px-2 font-bold uppercase tracking-wider text-[11px]">Status</th>
                      <th className="pb-4 px-2 font-bold uppercase tracking-wider text-[11px] text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50">
                    {keys.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-slate-500 font-medium">Belum ada API Key tersimpan</td></tr>}
                    {keys.map(k => (
                      <tr key={k.id} className="hover:bg-indigo-50/30 transition-colors group">
                        <td className="py-5 px-2">
                          <div className="font-extrabold text-slate-800">{k.name}</div>
                          <div className="font-mono text-[11px] font-bold text-slate-500 mt-1 bg-white/60 shadow-sm border border-slate-100 inline-block px-2 py-0.5 rounded-md">{k.key}</div>
                          {k.description && <div className="text-xs font-medium text-slate-500 mt-2 italic">{k.description}</div>}
                          {k.lastRotatedAt && <div className="text-[10px] font-bold text-emerald-600 mt-2">Rotated: {new Date(k.lastRotatedAt).toLocaleDateString()}</div>}
                        </td>
                        <td className="py-5 px-2">
                          <span className="capitalize bg-slate-100 text-slate-600 border border-slate-200/50 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider shadow-sm">{k.provider}</span>
                        </td>
                        <td className="py-5 px-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border ${k.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' : 'bg-rose-50 text-rose-600 border-rose-100/50'}`}>
                            {k.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="py-5 px-2 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleToggleStatus(k.id, k.isActive)} className="text-[10px] px-3 py-1.5 bg-white border border-slate-200/60 shadow-sm hover:bg-slate-50 text-slate-700 rounded-lg font-bold transition-all hover:scale-105">
                              {k.isActive ? 'Disable' : 'Enable'}
                            </button>
                            <button onClick={() => setModalState({ type: 'rotate', targetId: k.id })} className="text-[10px] px-3 py-1.5 bg-amber-50 border border-amber-100/50 shadow-sm hover:bg-amber-100 text-amber-700 rounded-lg font-bold transition-all hover:scale-105">
                              Rotate
                            </button>
                            <button onClick={() => setModalState({ type: 'desc', targetId: k.id, currentValue: k.description })} className="text-[10px] px-3 py-1.5 bg-blue-50 border border-blue-100/50 shadow-sm hover:bg-blue-100 text-blue-700 rounded-lg font-bold transition-all hover:scale-105">
                              Edit Desc
                            </button>
                            <button onClick={() => setModalState({ type: 'delete', targetId: k.id })} className="text-rose-500 p-2 bg-white hover:bg-rose-50 border border-slate-100 shadow-sm rounded-lg transition-all hover:scale-105">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
