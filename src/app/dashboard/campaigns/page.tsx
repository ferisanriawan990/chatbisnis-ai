'use client';

import { useState, useEffect } from 'react';
import { Megaphone, Plus, Gift, RefreshCcw, Send, AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState('MANUAL');
  const [messageTemplate, setMessageTemplate] = useState('Halo {{name}}, kami ada promo spesial untuk Anda hari ini!');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/dashboard/campaigns');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/dashboard/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, messageTemplate })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Kampanye dibuat! ${data.targetCount} prospek diantrekan.`);
        setIsModalOpen(false);
        fetchCampaigns();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Gagal menyimpan kampanye');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Memuat data kampanye...</div>;

  return (
    <div className="max-w-6xl space-y-6">
      <Toaster position="top-right" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-fuchsia-600" /> Manajemen Kampanye
          </h1>
          <p className="text-slate-500 mt-1">Kirim pesan massal (Broadcast) ke pelanggan Anda tanpa risiko diblokir WhatsApp.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-fuchsia-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-fuchsia-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" /> Buat Kampanye
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {campaigns.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Megaphone className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Belum Ada Kampanye</h3>
            <p className="text-slate-500 mb-6">Mulai jangkau pelanggan Anda dan tingkatkan omset hari ini!</p>
            <button onClick={() => setIsModalOpen(true)} className="text-fuchsia-600 font-bold hover:underline">
              + Buat Kampanye Pertama
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {campaigns.map(camp => (
              <div key={camp.id} className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{camp.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        camp.type === 'MANUAL' ? 'bg-blue-100 text-blue-700' :
                        camp.type === 'BIRTHDAY_AUTO' ? 'bg-pink-100 text-pink-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {camp.type === 'MANUAL' && <span className="flex items-center gap-1"><Send className="w-3 h-3"/> Massal (Manual)</span>}
                        {camp.type === 'BIRTHDAY_AUTO' && <span className="flex items-center gap-1"><Gift className="w-3 h-3"/> Ulang Tahun</span>}
                        {camp.type === 'RETARGETING_AUTO' && <span className="flex items-center gap-1"><RefreshCcw className="w-3 h-3"/> Retargeting</span>}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${camp.status === 'RUNNING' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                        {camp.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-2xl font-black text-slate-900">{camp.totalTargets}</span>
                    <span className="text-xs text-slate-500 font-medium">Total Target</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 border-t border-slate-100 pt-4 mt-2">
                  <div className="text-center p-2 bg-slate-50 rounded-lg">
                    <Loader2 className="w-4 h-4 mx-auto text-slate-400 mb-1" />
                    <span className="block font-bold text-slate-700">{camp.pendingCount}</span>
                    <span className="text-[10px] text-slate-500 uppercase">Antre</span>
                  </div>
                  <div className="text-center p-2 bg-emerald-50 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
                    <span className="block font-bold text-emerald-700">{camp.sentCount}</span>
                    <span className="text-[10px] text-emerald-600 uppercase">Terkirim</span>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded-lg">
                    <AlertCircle className="w-4 h-4 mx-auto text-red-500 mb-1" />
                    <span className="block font-bold text-red-700">{camp.failedCount}</span>
                    <span className="text-[10px] text-red-600 uppercase">Gagal</span>
                  </div>
                  <div className="text-center p-2 bg-slate-100 rounded-lg" title="Opt-out / Berhenti Berlangganan">
                    <XCircle className="w-4 h-4 mx-auto text-slate-400 mb-1" />
                    <span className="block font-bold text-slate-700">{camp.optOutCount}</span>
                    <span className="text-[10px] text-slate-500 uppercase">Opt-out</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Buat Kampanye Baru</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kampanye</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Misal: Promo Merdeka 2026"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipe Kampanye</label>
                <select 
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 outline-none bg-white"
                >
                  <option value="MANUAL">Pesan Massal (Kirim ke semua Leads aktif saat ini)</option>
                  <option value="BIRTHDAY_AUTO">Otomatis Ulang Tahun (Kirim setiap jam 12 malam)</option>
                  <option value="RETARGETING_AUTO">Retargeting Pasif (Kirim ke Leads yang diam &gt;30 hari)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">Sistem Drip kami hanya mengirim maksimal 10 pesan/menit untuk mencegah pemblokiran nomor WA Anda.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Template Pesan</label>
                <textarea 
                  required
                  rows={4}
                  value={messageTemplate}
                  onChange={e => setMessageTemplate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">Gunakan <code>{`{{name}}`}</code> untuk menyapa nama prospek. Kami akan menyisipkan tautan Opt-out otomatis di akhir pesan.</p>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="bg-fuchsia-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-fuchsia-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? 'Menyimpan...' : <><Send className="w-4 h-4"/> Buat & Jalankan</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
