'use client';

import { useState, useEffect } from 'react';
import { Send, Users, Image as ImageIcon, AlertCircle } from 'lucide-react';

export default function BroadcastPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    messageTemplate: 'Halo [Nama], kami punya penawaran spesial untuk Anda!',
    targetTags: '',
    imageUrl: '',
  });

  const [sendResult, setSendResult] = useState<{ success?: boolean; message?: string; targetCount?: number } | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/dashboard/broadcast');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (e) {}
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSendResult(null);

    try {
      const res = await fetch('/api/dashboard/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();
      if (res.ok) {
        setSendResult({ success: true, message: 'Broadcast berhasil dikirim ke antrean pengiriman!', targetCount: data.targetCount });
        setForm({ name: '', messageTemplate: 'Halo [Nama], ', targetTags: '', imageUrl: '' });
        fetchCampaigns();
      } else {
        setSendResult({ success: false, message: data.error || 'Gagal mengirim broadcast' });
      }
    } catch (error: any) {
      setSendResult({ success: false, message: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Send className="w-6 h-6 text-purple-600" />
          Broadcast Promosi
        </h1>
        <p className="text-slate-500 mt-1">Kirim pesan massal (promosi / pengumuman) secara otomatis ke seluruh prospek & pelanggan Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold mb-4 text-slate-800">Buat Pesan Baru</h2>
          
          {sendResult && (
            <div className={`p-4 mb-6 rounded-xl border ${sendResult.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
              <p className="font-medium flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {sendResult.message}
              </p>
              {sendResult.targetCount !== undefined && (
                <p className="text-sm mt-1 opacity-90">Pesan ini akan dikirimkan ke {sendResult.targetCount} pelanggan.</p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Kampanye (Internal)</label>
              <input required name="name" value={form.name} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-500" placeholder="Cth: Promo Lebaran 2024" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                Isi Pesan Promosi
                <span className="text-xs font-normal bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Gunakan [Nama] untuk personalisasi</span>
              </label>
              <textarea required name="messageTemplate" value={form.messageTemplate} onChange={handleChange} rows={5} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-500 resize-none"></textarea>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Link Gambar Promosi (Opsional)
              </label>
              <input name="imageUrl" type="url" value={form.imageUrl} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-500" placeholder="https://..." />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                <Users className="w-4 h-4" /> Target Pelanggan (Tag / Label)
              </label>
              <input name="targetTags" value={form.targetTags} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-500" placeholder="Kosongkan untuk kirim ke SEMUA kontak, atau isi cth: VIP" />
              <p className="text-xs text-slate-500 mt-2">Pesan akan dikirim secara perlahan dengan jeda waktu untuk menghindari limitasi WhatsApp.</p>
            </div>

            <button disabled={isLoading} type="submit" className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2">
              {isLoading ? 'Sedang Memproses...' : <><Send className="w-5 h-5" /> Kirim Broadcast Sekarang</>}
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold mb-4 text-slate-800">Riwayat Broadcast</h2>
          
          <div className="space-y-4">
            {campaigns.length === 0 ? (
              <div className="text-center p-8 border-2 border-dashed border-slate-100 rounded-2xl">
                <p className="text-slate-500">Belum ada riwayat pengiriman promosi.</p>
              </div>
            ) : (
              campaigns.map((c) => (
                <div key={c.id} className="p-4 border border-slate-100 rounded-xl hover:border-purple-200 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800">{c.name}</h3>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${c.status === 'completed' ? 'bg-green-100 text-green-700' : c.status === 'processing' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                      {c.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-3">{c.messageTemplate}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {c._count?.recipients || 0} Penerima</span>
                    <span>{new Date(c.createdAt).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
