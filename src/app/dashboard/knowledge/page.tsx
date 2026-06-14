'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Upload, Plus, Globe, Trash2, Database, FileText, CheckCircle, RefreshCw, Activity } from 'lucide-react';

export default function KnowledgePage() {
  const { data: session } = useSession();
  const tenants = (session?.user as any)?.tenants || [];
  const activeTenantId = tenants[0]?.id; // Default tenant

  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [showManualModal, setShowManualModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showScrapeModal, setShowScrapeModal] = useState(false);

  // Form states
  const [urlToScrape, setUrlToScrape] = useState('');
  const [manualForm, setManualForm] = useState({ question: '', answer: '' });
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSources = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/knowledge');
      if (res.ok) {
        const data = await res.json();
        setSources(data.sources);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTenantId) fetchSources();
  }, [activeTenantId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus sumber ini dan semua isinya?')) return;
    try {
      await fetch(`/api/dashboard/knowledge/${id}`, { method: 'DELETE' });
      fetchSources();
    } catch (e) {}
  };

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlToScrape) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/dashboard/knowledge/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToScrape })
      });
      if (res.ok) {
        setShowScrapeModal(false);
        setUrlToScrape('');
        fetchSources();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.question || !manualForm.answer) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/dashboard/knowledge/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'qa', question: manualForm.question, answer: manualForm.answer })
      });
      if (res.ok) {
        setShowManualModal(false);
        setManualForm({ question: '', answer: '' });
        fetchSources();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload) return;
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('file', fileToUpload);
    try {
      const res = await fetch('/api/dashboard/knowledge/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        setShowUploadModal(false);
        setFileToUpload(null);
        fetchSources();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="text-gray-500">Pusat data kecerdasan AI Anda.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm transition"
          >
            <Plus size={18} /> Q&A Manual
          </button>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 shadow-sm transition"
          >
            <Upload size={18} /> Upload Dokumen
          </button>
          <button 
            onClick={() => setShowScrapeModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition"
          >
            <Globe size={18} /> Web Scraping
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Database size={18} /> Sumber Pengetahuan Anda
          </h2>
          <button onClick={fetchSources} className="text-gray-500 hover:text-blue-600 transition">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {sources.length === 0 && !loading ? (
          <div className="p-12 text-center text-gray-500">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">Belum ada Knowledge Base</p>
            <p className="max-w-md mx-auto">Tambahkan produk, FAQ, atau scrape website Anda agar AI dapat menjawab pertanyaan pelanggan secara akurat.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">Judul Sumber</th>
                  <th className="px-6 py-4 font-medium">Tipe</th>
                  <th className="px-6 py-4 font-medium">Jumlah Item</th>
                  <th className="px-6 py-4 font-medium">Tanggal</th>
                  <th className="px-6 py-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sources.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-800 flex items-center gap-3">
                      {s.type === 'web_scraping' && <Globe size={16} className="text-indigo-500" />}
                      {s.type === 'manual' && <Plus size={16} className="text-green-500" />}
                      {['excel', 'csv', 'pdf', 'docx'].includes(s.type) && <FileText size={16} className="text-blue-500" />}
                      {s.type === 'google_sheet' && <Activity size={16} className="text-emerald-500" />}
                      <span className="truncate max-w-[200px] font-bold text-slate-800">{s.title}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded text-xs uppercase font-medium">
                        {s.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-700">{s.itemCount}</span> baris
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(s.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:bg-red-50 p-2 rounded transition">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODALS */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Tambah Q&A Manual</h3>
            <form onSubmit={handleManualSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Pertanyaan (Q)</label>
                <input 
                  type="text" required value={manualForm.question} onChange={e => setManualForm({...manualForm, question: e.target.value})}
                  placeholder="Contoh: Apakah bisa COD?"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Jawaban (A)</label>
                <textarea 
                  required rows={4} value={manualForm.answer} onChange={e => setManualForm({...manualForm, answer: e.target.value})}
                  placeholder="Bisa kak, kami melayani COD..."
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowManualModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting ? 'Menyimpan...' : <><CheckCircle size={18}/> Simpan</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showScrapeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Web Scraping URL</h3>
            <p className="text-sm text-gray-500 mb-4">Masukkan URL website, toko online, atau artikel Anda. Bot AI akan membaca dan mengekstrak teksnya secara otomatis.</p>
            <form onSubmit={handleScrape}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Website URL</label>
                <input 
                  type="url" required value={urlToScrape} onChange={e => setUrlToScrape(e.target.value)}
                  placeholder="https://tokoanda.com/faq"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowScrapeModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting ? 'Mengekstrak...' : <><Globe size={18}/> Mulai Scrape</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Upload Dokumen (Excel/CSV/PDF)</h3>
            <p className="text-sm text-gray-500 mb-4">Upload data produk atau FAQ secara massal. Ukuran maksimal 10MB.</p>
            <form onSubmit={handleUpload}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih File</label>
                <input 
                  type="file" required accept=".xlsx,.xls,.csv,.pdf,.docx" onChange={e => setFileToUpload(e.target.files?.[0] || null)}
                  className="w-full border border-dashed border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowUploadModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
                <button type="submit" disabled={isSubmitting || !fileToUpload} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting ? 'Mengupload...' : <><Upload size={18}/> Upload</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
