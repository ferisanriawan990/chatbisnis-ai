'use client';

import { useState, useEffect, useCallback } from 'react';
import { Store, Save, Send, Plus, Trash2, ChevronRight, MessageCircle, Sparkles } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface Template {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  requiredFields: string;
  sampleQuestions: string;
}

interface BotConfig {
  id?: string;
  templateId: string;
  businessName: string;
  businessDescription: string;
  productsOrServices: string;
  pricingInfo: string;
  operationalHours: string;
  address: string;
  serviceArea: string;
  paymentMethods: string;
  deliveryMethods: string;
  humanAdminContact: string;
  catalogUrl: string;
  mapsUrl: string;
  customFAQ: string;
  tone: string;
  languageStyle: string;
  botMode: string;
  isBotActive: boolean;
  template?: Template;
}

const INITIAL_CONFIG: BotConfig = {
  templateId: '',
  businessName: '',
  businessDescription: '',
  productsOrServices: '',
  pricingInfo: '',
  operationalHours: '',
  address: '',
  serviceArea: '',
  paymentMethods: '',
  deliveryMethods: '',
  humanAdminContact: '',
  catalogUrl: '',
  mapsUrl: '',
  customFAQ: '[]',
  tone: 'sopan',
  languageStyle: 'id',
  botMode: 'auto_reply',
  isBotActive: false,
};

const CATEGORY_ICONS: Record<string, string> = {
  'E-Commerce': '🛒',
  'Jasa': '🔧',
  'F&B': '🍽️',
  'Kesehatan & Kecantikan': '💇',
  'Properti': '🏠',
  'Transportasi': '🚗',
  'Pendidikan': '📚',
  'Retail': '🏪',
  'Digital & Teknologi': '💻',
  'Custom': '⚙️',
};

export default function BotSettingsPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [config, setConfig] = useState<BotConfig>(INITIAL_CONFIG);
  const [faqList, setFaqList] = useState<Array<{ q: string; a: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testReply, setTestReply] = useState('');
  const [testing, setTesting] = useState(false);
  const [step, setStep] = useState(1);

  const fetchData = useCallback(async () => {
    try {
      const [tmplRes, configRes] = await Promise.all([
        fetch('/api/templates'),
        fetch('/api/bot-config'),
      ]);

      if (tmplRes.ok) {
        const { templates: t } = await tmplRes.json();
        setTemplates(t);
      }

      if (configRes.ok) {
        const { config: c } = await configRes.json();
        if (c) {
          setConfig({
            ...INITIAL_CONFIG,
            ...c,
            customFAQ: c.customFAQ || '[]',
          });
          try {
            setFaqList(JSON.parse(c.customFAQ || '[]'));
          } catch { /* ignore */ }
          if (c.templateId) setStep(2);
        }
      }
    } catch {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]); // eslint-disable-line react-hooks/set-state-in-effect

  const selectedTemplate = templates.find(t => t.id === config.templateId);

  const handleSelectTemplate = (tmpl: Template) => {
    setConfig(prev => ({ ...prev, templateId: tmpl.id }));
    setStep(2);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleAddFAQ = () => {
    setFaqList(prev => [...prev, { q: '', a: '' }]);
  };

  const handleRemoveFAQ = (idx: number) => {
    setFaqList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleFAQChange = (idx: number, field: 'q' | 'a', value: string) => {
    setFaqList(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleSave = async () => {
    if (!config.templateId) {
      toast.error('Pilih template usaha terlebih dahulu');
      return;
    }
    if (!config.businessName.trim()) {
      toast.error('Nama bisnis wajib diisi');
      return;
    }
    if (!config.businessDescription.trim()) {
      toast.error('Deskripsi bisnis wajib diisi');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...config,
        customFAQ: JSON.stringify(faqList.filter(f => f.q.trim() && f.a.trim())),
      };

      const res = await fetch('/api/bot-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success('Konfigurasi berhasil disimpan!');
        const { config: c } = await res.json();
        setConfig(prev => ({ ...prev, ...c }));
      } else {
        const err = await res.json();
        toast.error(err.error || 'Gagal menyimpan');
      }
    } catch {
      toast.error('Kesalahan jaringan');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testMessage.trim()) return;
    setTesting(true);
    setTestReply('');
    try {
      const res = await fetch('/api/chat/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: testMessage }),
      });
      if (res.ok) {
        const { reply } = await res.json();
        setTestReply(reply);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Gagal mengenerate jawaban');
      }
    } catch {
      toast.error('Kesalahan jaringan');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><span className="animate-pulse text-blue-600 font-medium">Memuat pengaturan template...</span></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-6 rounded-2xl text-white shadow-lg">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Store className="w-7 h-7" /> Template Bot Bisnis
        </h1>
        <p className="text-indigo-100 mt-1">Pilih template sesuai jenis usaha Anda, isi data bisnis, lalu bot siap melayani customer.</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {[
          { num: 1, label: 'Pilih Template' },
          { num: 2, label: 'Data Bisnis' },
          { num: 3, label: 'Test Bot' },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <button
              onClick={() => setStep(s.num)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                step === s.num
                  ? 'bg-indigo-600 text-white shadow-md'
                  : step > s.num
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
              }`}
            >
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{s.num}</span>
              {s.label}
            </button>
            {i < 2 && <ChevronRight className="w-4 h-4 text-slate-300" />}
          </div>
        ))}
      </div>

      {/* Step 1: Template Selection */}
      {step === 1 && (
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" /> Pilih Jenis Usaha
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(tmpl => {
              const isSelected = config.templateId === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  onClick={() => handleSelectTemplate(tmpl)}
                  className={`text-left p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 shadow-md'
                      : 'border-slate-200 bg-white hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{CATEGORY_ICONS[tmpl.category] || '📋'}</span>
                    <div>
                      <h3 className="font-bold text-slate-800">{tmpl.name}</h3>
                      <span className="text-xs text-slate-500">{tmpl.category}</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{tmpl.description}</p>
                  {isSelected && (
                    <div className="mt-2 text-xs font-semibold text-indigo-600 flex items-center gap-1">
                      ✓ Dipilih
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {selectedTemplate && (
            <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
              <h3 className="font-semibold text-indigo-800 mb-2">Contoh Pertanyaan Customer:</h3>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  try {
                    return (JSON.parse(selectedTemplate.sampleQuestions) as string[]).map((q, i) => (
                      <span key={i} className="px-3 py-1 bg-white rounded-full text-sm text-indigo-700 border border-indigo-200">
                        &ldquo;{q}&rdquo;
                      </span>
                    ));
                  } catch { return null; }
                })()}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Step 2: Business Data Form */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Business Info */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
              <Store className="w-5 h-5 text-blue-500" /> Data Bisnis
            </h2>
            {selectedTemplate && <p className="text-sm text-slate-500 mb-4">Template: <span className="font-semibold text-indigo-600">{selectedTemplate.name}</span></p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Nama Bisnis *</label><input name="businessName" value={config.businessName} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Cth: Warung Kopi Mantap" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Kontak Admin</label><input name="humanAdminContact" value={config.humanAdminContact} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" placeholder="08123456789" /></div>
              <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi Bisnis *</label><textarea name="businessDescription" value={config.businessDescription} onChange={handleChange} rows={3} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" placeholder="Jelaskan bisnis Anda secara singkat..." /></div>
              <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Produk / Layanan</label><textarea name="productsOrServices" value={config.productsOrServices} onChange={handleChange} rows={3} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" placeholder="Cth: Nasi Goreng Rp 15.000, Mie Ayam Rp 12.000..." /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Info Harga</label><textarea name="pricingInfo" value={config.pricingInfo} onChange={handleChange} rows={2} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" placeholder="Range harga, promo, paket..." /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Jam Operasional</label><input name="operationalHours" value={config.operationalHours} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" placeholder="08:00 - 17:00" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label><input name="address" value={config.address} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" placeholder="Jl. Contoh No. 1, Jakarta" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Area Layanan</label><input name="serviceArea" value={config.serviceArea} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" placeholder="Jabodetabek" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Metode Pembayaran</label><input name="paymentMethods" value={config.paymentMethods} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" placeholder="Transfer, COD, QRIS" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Metode Pengiriman</label><input name="deliveryMethods" value={config.deliveryMethods} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" placeholder="GoSend, JNE, ambil di toko" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Link Katalog / Menu</label><input name="catalogUrl" value={config.catalogUrl} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" placeholder="https://..." /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Link Google Maps</label><input name="mapsUrl" value={config.mapsUrl} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" placeholder="https://maps.google.com/..." /></div>
            </div>
          </section>

          {/* Custom FAQ */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><MessageCircle className="w-5 h-5 text-emerald-500" /> FAQ Custom</h2>
              <button onClick={handleAddFAQ} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-semibold hover:bg-emerald-100 flex items-center gap-1"><Plus className="w-4 h-4" /> Tambah</button>
            </div>
            {faqList.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Belum ada FAQ. Klik &quot;Tambah&quot; untuk menambahkan.</p>
            ) : (
              <div className="space-y-4">
                {faqList.map((faq, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-slate-500">FAQ #{idx + 1}</span>
                      <button onClick={() => handleRemoveFAQ(idx)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <input placeholder="Pertanyaan..." value={faq.q} onChange={e => handleFAQChange(idx, 'q', e.target.value)} className="w-full p-2 mb-2 text-sm border rounded-lg" />
                    <textarea placeholder="Jawaban..." value={faq.a} onChange={e => handleFAQChange(idx, 'a', e.target.value)} rows={2} className="w-full p-2 text-sm border rounded-lg" />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Bot Style & Mode */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Gaya & Mode Bot</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gaya Bahasa</label>
                <select name="tone" value={config.tone} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none">
                  <option value="santai">🏖️ Santai</option>
                  <option value="sopan">🤝 Sopan</option>
                  <option value="profesional">💼 Profesional</option>
                  <option value="ramah">😊 Ramah</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bahasa Utama</label>
                <select name="languageStyle" value={config.languageStyle} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none">
                  <option value="id">🇮🇩 Indonesia</option>
                  <option value="id-santai">🇮🇩 Indonesia Santai</option>
                  <option value="id-en">🌐 Campuran ID-EN</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mode Bot</label>
                <select name="botMode" value={config.botMode} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none">
                  <option value="auto_reply">🤖 Auto Reply Penuh</option>
                  <option value="faq_only">📋 FAQ Saja</option>
                  <option value="collect_and_handover">📝 Kumpulkan Data → Admin</option>
                </select>
              </div>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex flex-wrap gap-3">
            <button onClick={handleSave} disabled={saving} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-50 transition-all">
              <Save className="w-5 h-5" /> {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
            </button>
            <button onClick={() => setStep(3)} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-emerald-200 transition-all">
              <Send className="w-5 h-5" /> Test Bot →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Test Bot */}
      {step === 3 && (
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-500" /> Test Chatbot
          </h2>
          {selectedTemplate && <p className="text-sm text-slate-500 mb-4">Template: <span className="font-semibold text-indigo-600">{selectedTemplate.name}</span> | Bisnis: <span className="font-semibold">{config.businessName || '-'}</span></p>}

          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                value={testMessage}
                onChange={e => setTestMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTest()}
                placeholder="Ketik pertanyaan customer... (cth: halo, berapa harganya?)"
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button onClick={handleTest} disabled={testing} className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50 transition-all">
                {testing ? '...' : <Send className="w-5 h-5" />}
              </button>
            </div>

            {testReply && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-xs font-bold text-emerald-700 mb-1">Jawaban Bot:</p>
                <p className="text-sm text-slate-800 whitespace-pre-wrap">{testReply}</p>
              </div>
            )}

            {selectedTemplate && (
              <div>
                <p className="text-xs font-bold text-slate-500 mb-2">Contoh pertanyaan yang bisa dicoba:</p>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    try {
                      return (JSON.parse(selectedTemplate.sampleQuestions) as string[]).map((q, i) => (
                        <button key={i} onClick={() => setTestMessage(q)} className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-100 rounded-full text-sm text-slate-700 hover:text-indigo-700 transition-colors">
                          {q}
                        </button>
                      ));
                    } catch { return null; }
                  })()}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
