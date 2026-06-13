'use client';

import { useState, useEffect } from 'react';
import { Database, Download, Trash2, Clock, AlertOctagon } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function PrivacySettingsPage() {
  const [retentionDays, setRetentionDays] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wipeConfirm, setWipeConfirm] = useState('');
  const [wiping, setWiping] = useState(false);

  useEffect(() => {
    fetch('/api/dashboard/settings/privacy')
      .then(res => res.json())
      .then(data => {
        if (data.chatRetentionDays !== undefined) setRetentionDays(data.chatRetentionDays);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSaveRetention = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/dashboard/settings/privacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatRetentionDays: retentionDays })
      });
      if (res.ok) toast.success('Kebijakan retensi berhasil disimpan');
      else toast.error('Gagal menyimpan pengaturan');
    } catch {
      toast.error('Kesalahan jaringan');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    // Initiate download
    window.location.href = '/api/dashboard/settings/privacy/export';
  };

  const handleWipe = async () => {
    if (wipeConfirm !== 'HAPUS PERMANEN') {
      toast.error('Teks konfirmasi tidak cocok!');
      return;
    }
    setWiping(true);
    try {
      const res = await fetch('/api/dashboard/settings/privacy/wipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationText: wipeConfirm })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setWipeConfirm('');
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Gagal menghapus data');
    } finally {
      setWiping(false);
    }
  };

  if (loading) return <div className="p-8">Memuat pengaturan...</div>;

  return (
    <div className="max-w-4xl space-y-8">
      <Toaster position="top-right" />
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-6 h-6 text-indigo-600" /> Privasi & Data
        </h1>
        <p className="text-slate-500 mt-1">Kelola data pelanggan, cadangkan, dan kontrol berapa lama Anda ingin menyimpan riwayat percakapan bisnis Anda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup Export */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center mb-4">
              <Download className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Export Data Backup</h3>
            <p className="text-slate-500 text-sm">Download seluruh riwayat percakapan (Chat Logs), Prospek (Leads), dan Data Pesanan Anda dalam format JSON untuk keperluan arsip pribadi Anda.</p>
          </div>
          <button 
            onClick={handleExport}
            className="mt-6 flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" /> Mulai Download
          </button>
        </div>

        {/* Data Retention */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Penghapusan Otomatis (Retensi)</h3>
            <p className="text-slate-500 text-sm mb-4">Atur berapa lama sistem harus menyimpan riwayat chat. Data yang lebih tua dari batas hari ini akan dihapus secara otomatis selamanya.</p>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Masa Simpan Chat (Hari)</label>
              <div className="flex gap-3">
                <input 
                  type="number" 
                  min={0}
                  value={retentionDays}
                  onChange={e => setRetentionDays(Number(e.target.value))}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button 
                  onClick={handleSaveRetention}
                  disabled={saving}
                  className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? 'Simpan...' : 'Simpan'}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2">Ketik 0 jika Anda ingin menyimpan semua data selamanya (Tidak dihapus otomatis).</p>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 p-6 rounded-xl border border-red-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white text-red-600 rounded-xl shrink-0 shadow-sm">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-800">Zona Bahaya: Wipe Data</h3>
            <p className="text-red-600 text-sm mt-1 mb-4">Aksi ini akan MENGHAPUS SELURUH RIWAYAT CHAT PELANGGAN Anda dari database kami secara instan dan permanen. Aksi ini tidak dapat dibatalkan!</p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                value={wipeConfirm}
                onChange={e => setWipeConfirm(e.target.value)}
                placeholder='Ketik "HAPUS PERMANEN" untuk konfirmasi'
                className="flex-1 px-4 py-2.5 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none placeholder:text-red-300 bg-white"
              />
              <button 
                onClick={handleWipe}
                disabled={wiping || wipeConfirm !== 'HAPUS PERMANEN'}
                className="bg-red-600 text-white font-bold px-6 py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-50 shrink-0 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> {wiping ? 'Menghapus...' : 'Wipe Semua Chat'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
