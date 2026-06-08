'use client';

import { useState, useEffect } from 'react';
import { Download, Copy, Check, FileJson } from 'lucide-react';

interface TemplateMeta {
  id: string;
  title: string;
  description: string;
  target: string;
  status: string;
  filename: string;
}

export default function N8nTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/n8n-templates')
      .then(res => res.json())
      .then(data => {
        if (data.templates) setTemplates(data.templates);
        setLoading(false);
      });
  }, []);

  const placeholders = `WAHA_BASE_URL=https://waha.domainanda.com
WAHA_API_KEY=your_waha_api_key
FLAZ_API_KEY=sk-your_flaz_api_key
BUSINESS_NAME=ChatBisnis AI
ADMIN_WHATSAPP_NUMBER=628123456789
SESSION_NAME=chatbisnis_user_xxxxx
WEBSITE_API_BASE_URL=https://chatbisnis-ai.vercel.app
WEBSITE_INTERNAL_API_KEY=your_internal_secret
WAHA_WEBHOOK_SECRET=your_webhook_secret_here`;

  const copyPlaceholders = () => {
    navigator.clipboard.writeText(placeholders);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Template n8n Chatbot WhatsApp</h1>
        <p className="mt-2 text-slate-600">
          Download template workflow n8n siap pakai untuk menghubungkan WAHA, Flaz Cloud AI, dan WhatsApp secara otomatis.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-amber-800 mb-2">Penting: Placeholder Setup</h3>
        <p className="text-amber-700 mb-4 text-sm">
          Semua file JSON template menggunakan variabel placeholder demi keamanan. Anda wajib menggantinya dengan kredensial asli langsung di dalam dashboard n8n Anda. Jangan pernah share API Key Anda di chat umum atau frontend!
        </p>
        <div className="bg-white rounded-lg p-4 font-mono text-sm border border-amber-100 flex justify-between items-start">
          <pre className="text-slate-700 whitespace-pre-wrap">{placeholders}</pre>
          <button
            onClick={copyPlaceholders}
            className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-sm transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center py-12 text-slate-500">Memuat template...</div>
        ) : (
          templates.map(template => (
            <div key={template.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <FileJson className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{template.title}</h3>
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {template.target}
                    </span>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                  template.status === 'Recommended' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
                }`}>
                  {template.status}
                </span>
              </div>
              <p className="text-slate-600 text-sm mb-6 flex-grow">{template.description}</p>
              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <a
                  href={`/api/n8n-templates/${template.id}/download`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download JSON
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mt-8">
        <h3 className="font-semibold text-slate-900 mb-3">Cara Import ke n8n Cloud</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600 mb-6">
          <li>Download salah satu template JSON di atas.</li>
          <li>Buka dashboard n8n Cloud Anda.</li>
          <li>Klik menu tiga titik (⋮) di pojok kanan atas layar n8n.</li>
          <li>Pilih <strong>Import from File</strong> dan masukkan file JSON yang baru didownload.</li>
          <li>Isi semua placeholder (contoh: <code>{'{{FLAZ_API_KEY}}'}</code>) dengan data asli Anda di setiap node.</li>
          <li>Klik <strong>Save</strong> dan aktifkan toggle <strong>Active</strong>.</li>
        </ol>

        <h3 className="font-semibold text-rose-800 mb-3">⚠️ Peringatan Keamanan (Production)</h3>
        <ul className="list-disc list-inside space-y-2 text-sm text-rose-700">
          <li>Untuk production, WAHA <strong>wajib</strong> menggunakan domain HTTPS. Jangan gunakan format <code>IP:3000</code>.</li>
          <li>Jangan pernah memasukkan API key ke dalam frontend atau kode publik.</li>
          <li>Simpan kredensial di <strong>n8n Credentials</strong> jika memungkinkan daripada menulis teks mentah (raw text) di HTTP Request.</li>
          <li>Jangan pernah membagikan (share) API key Anda di forum publik atau chat umum.</li>
        </ul>
      </div>
    </div>
  );
}
