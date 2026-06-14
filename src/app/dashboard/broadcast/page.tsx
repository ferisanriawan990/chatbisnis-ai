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
    <div className="max-w-7xl mx-auto space-y-8 pb-20 p-4 md:p-8 animate-in fade-in duration-700">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-lg p-8 rounded-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-pink-400/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg shadow-purple-500/20">
              <Send className="w-8 h-8 text-white" />
            </div>
            Broadcast Promosi
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-lg ml-14">Kirim pesan massal (promosi / pengumuman) secara otomatis ke seluruh prospek & pelanggan Anda.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60">
          <h2 className="text-xl font-extrabold mb-6 text-slate-800">Buat Pesan Baru</h2>
          
          {sendResult && (
            <div className={`p-4 mb-6 rounded-2xl border ${sendResult.success ? 'bg-green-50/80 border-green-200 text-green-700' : 'bg-red-50/80 border-red-200 text-red-700'} backdrop-blur-md`}>
              <p className="font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {sendResult.message}
              </p>
              {sendResult.targetCount !== undefined && (
                <p className="text-sm mt-1 font-medium opacity-90">Pesan ini akan dikirimkan ke {sendResult.targetCount} pelanggan.</p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nama Kampanye (Internal)</label>
              <input required name="name" value={form.name} onChange={handleChange} className="w-full p-4 bg-slate-50/80 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-medium text-slate-700 shadow-sm" placeholder="Cth: Promo Lebaran 2024" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center justify-between">
                Isi Pesan Promosi
                <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded-full uppercase tracking-wider">Gunakan [Nama] untuk personalisasi</span>
              </label>
              <textarea required name="messageTemplate" value={form.messageTemplate} onChange={handleChange} rows={5} className="w-full p-4 bg-slate-50/80 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 resize-none transition-all font-medium text-slate-700 shadow-sm"></textarea>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-slate-400" /> Link Gambar Promosi (Opsional)
              </label>
              <input name="imageUrl" type="url" value={form.imageUrl} onChange={handleChange} className="w-full p-4 bg-slate-50/80 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-medium text-slate-700 shadow-sm" placeholder="https://..." />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" /> Target Pelanggan (Tag / Label)
              </label>
              <input name="targetTags" value={form.targetTags} onChange={handleChange} className="w-full p-4 bg-slate-50/80 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-medium text-slate-700 shadow-sm" placeholder="Kosongkan untuk kirim ke SEMUA kontak, atau isi cth: VIP" />
              <p className="text-xs font-medium text-slate-500 mt-2">Pesan akan dikirim secara perlahan dengan jeda waktu untuk menghindari limitasi WhatsApp.</p>
            </div>

            <button disabled={isLoading} type="submit" className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 shadow-md shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-0.5 text-white font-extrabold rounded-2xl transition-all disabled:opacity-50 flex justify-center items-center gap-2">
              {isLoading ? 'Sedang Memproses...' : <><Send className="w-5 h-5" /> Kirim Broadcast Sekarang</>}
            </button>
          </form>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60">
          <h2 className="text-xl font-extrabold mb-6 text-slate-800">Riwayat Broadcast</h2>
          
          <div className="space-y-4">
            {campaigns.length === 0 ? (
              <div className="text-center p-12 border-2 border-dashed border-slate-200/60 rounded-[2rem] bg-slate-50/50">
                <p className="text-slate-500 font-medium text-lg">Belum ada riwayat pengiriman promosi.</p>
              </div>
            ) : (
              campaigns.map((c) => (
                <div key={c.id} className="p-6 border border-slate-100/60 bg-white/50 rounded-2xl hover:border-purple-300 hover:shadow-lg hover:shadow-purple-50/50 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-extrabold text-slate-800 text-lg">{c.name}</h3>
                    <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm ${c.status === 'completed' ? 'bg-green-100 text-green-700' : c.status === 'processing' ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-600 line-clamp-2 mb-4 italic">&quot;{c.messageTemplate}&quot;</p>
                  <div className="flex items-center gap-5 text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-purple-400" /> {c._count?.recipients || 0} Penerima</span>
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
