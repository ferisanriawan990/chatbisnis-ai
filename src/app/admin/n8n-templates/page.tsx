'use client';


import { FileJson, Download, Plus, Star, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminN8nTemplatesPage() {
  const templates = [
    {
      id: 'default-waha',
      name: 'WAHA to ChatBisnis Webhook',
      description: 'Template dasar untuk meneruskan pesan masuk dari WhatsApp (WAHA) ke server ChatBisnis AI. Termasuk verifikasi signature.',
      status: 'Recommended',
      audience: 'Semua User',
      fileUrl: '/WAHA_to_Vercel_n8n_Workflow.json'
    }
  ];

  const handleDownload = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name.replace(/\s+/g, '_') + '.json';
    link.click();
    toast.success(`Mengunduh ${name}`);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileJson className="w-6 h-6 text-purple-600" />
            n8n Templates
          </h1>
          <p className="text-slate-500 mt-1">Kelola template workflow otomatisasi n8n untuk pengguna.</p>
        </div>
        <button onClick={() => toast('Fitur upload custom template segera hadir')} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition flex items-center gap-2">
          <Plus className="w-4 h-4" /> Upload Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map(t => (
          <div key={t.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-purple-300 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-slate-900">{t.name}</h3>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${t.status === 'Recommended' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                {t.status}
              </span>
            </div>
            <p className="text-sm text-slate-600 mb-6">{t.description}</p>
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded flex items-center gap-1"><Tag className="w-3 h-3" /> {t.audience}</span>
              {t.status === 'Recommended' && <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded flex items-center gap-1"><Star className="w-3 h-3" /> Best Practice</span>}
            </div>
            
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs text-slate-400">Pastikan ubah placeholder {"{{WAHA_WEBHOOK_SECRET}}"}</span>
              <button onClick={() => handleDownload(t.fileUrl, t.name)} className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-800">
                <Download className="w-4 h-4" /> Download JSON
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
