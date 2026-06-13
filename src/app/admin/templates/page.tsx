'use client';

import { useState, useEffect, useCallback } from 'react';
import { Layers, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Users, X, Save, Search, Sparkles } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import ConfirmModal from '@/components/ConfirmModal';

interface Template {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  systemPrompt: string;
  requiredFields: string;
  sampleQuestions: string;
  isActive: boolean;
  _count?: { botConfigs: number };
}

const EMPTY_TEMPLATE = {
  name: '', slug: '', category: '', description: '', systemPrompt: '', requiredFields: '[]', sampleQuestions: '[]', isActive: true,
};

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<Template | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState(EMPTY_TEMPLATE);
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState<Template | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/templates');
      if (res.ok) {
        const { templates: t } = await res.json();
        setTemplates(t);
      }
    } catch {
      toast.error('Gagal memuat template');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchTemplates(); }, [fetchTemplates]); // eslint-disable-line react-hooks/set-state-in-effect

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success('Template berhasil dibuat');
        setCreateModal(false);
        setForm(EMPTY_TEMPLATE);
        void fetchTemplates();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Gagal membuat template');
      }
    } catch {
      toast.error('Kesalahan jaringan');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editModal) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/templates/${editModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success('Template berhasil diupdate');
        setEditModal(null);
        void fetchTemplates();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Gagal mengupdate');
      }
    } catch {
      toast.error('Kesalahan jaringan');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (tmpl: Template) => {
    try {
      const res = await fetch(`/api/admin/templates/${tmpl.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !tmpl.isActive }),
      });
      if (res.ok) {
        toast.success(`Template ${tmpl.isActive ? 'dinonaktifkan' : 'diaktifkan'}`);
        void fetchTemplates();
      }
    } catch {
      toast.error('Gagal mengubah status');
    }
  };

  const handleDelete = async (tmpl: Template) => {
    try {
      const res = await fetch(`/api/admin/templates/${tmpl.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Template dihapus');
        void fetchTemplates();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Gagal menghapus');
      }
    } catch {
      toast.error('Kesalahan jaringan');
    }
  };

  const openEdit = (tmpl: Template) => {
    setForm({
      name: tmpl.name,
      slug: tmpl.slug,
      category: tmpl.category,
      description: tmpl.description,
      systemPrompt: tmpl.systemPrompt,
      requiredFields: tmpl.requiredFields,
      sampleQuestions: tmpl.sampleQuestions,
      isActive: tmpl.isActive,
    });
    setEditModal(tmpl);
  };

  const filteredTemplates = templates.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 font-sans">
      <Toaster position="top-right" />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-xl"><Layers className="w-6 h-6 text-indigo-600" /></div>
            AI Templates Master
          </h1>
          <p className="text-slate-500 mt-2 pl-1">Kelola direktori template prompt AI untuk berbagai industri klien.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari template..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
            />
          </div>
          <button onClick={() => { setForm(EMPTY_TEMPLATE); setCreateModal(true); }} className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all hover:-translate-y-0.5">
            <Plus className="w-4 h-4" /> Template Baru
          </button>
        </div>
      </div>

      {/* Template Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <Sparkles className="w-8 h-8 text-indigo-400 animate-spin" />
              <span className="font-medium text-slate-500">Memuat template...</span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="px-6 py-4">Nama Template</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4 text-center">Pengguna (Bots)</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      Tidak ada template yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredTemplates.map(tmpl => (
                    <tr key={tmpl.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{tmpl.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5 bg-slate-100 px-2 py-0.5 rounded-md inline-block font-mono">{tmpl.slug}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-full text-xs font-semibold">
                          {tmpl.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg text-sm font-medium text-slate-600">
                          <Users className="w-4 h-4 text-slate-400" /> {tmpl._count?.botConfigs || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => handleToggle(tmpl)} className="focus:outline-none transform transition-transform hover:scale-110 active:scale-95">
                          {tmpl.isActive
                            ? <ToggleRight className="w-8 h-8 text-emerald-500" />
                            : <ToggleLeft className="w-8 h-8 text-slate-300" />
                          }
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(tmpl)} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteModal(tmpl)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Hapus">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create / Edit */}
      {(createModal || editModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-8 py-5 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                {editModal ? 'Edit Template Konfigurasi' : 'Desain Template Baru'}
              </h2>
              <button onClick={() => { setEditModal(null); setCreateModal(false); }} className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-8 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Template <span className="text-red-500">*</span></label>
                  <input name="name" value={form.name} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-colors" placeholder="e.g. Kedai Kopi Pro" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Slug Unik <span className="text-red-500">*</span></label>
                  <input name="slug" value={form.slug} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-colors font-mono text-sm disabled:opacity-60 disabled:bg-slate-100" placeholder="e.g. kedai-kopi" disabled={!!editModal} />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kategori Industri <span className="text-red-500">*</span></label>
                <input name="category" value={form.category} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-colors" placeholder="e.g. F&B, Retail, Jasa" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Deskripsi Singkat</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={2} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-colors resize-none" placeholder="Deskripsikan keunggulan template ini untuk klien..." />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex justify-between">
                  <span>System Prompt AI <span className="text-red-500">*</span></span>
                  <span className="text-xs font-normal text-slate-400">Instruksi inti LLM</span>
                </label>
                <textarea name="systemPrompt" value={form.systemPrompt} onChange={handleChange} rows={6} className="w-full px-4 py-3 bg-slate-900 text-emerald-400 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-sm shadow-inner" placeholder="Kamu adalah asisten toko kopi..." />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex justify-between">
                    <span>Required Fields</span>
                    <span className="text-xs font-mono text-slate-400">JSON Array</span>
                  </label>
                  <textarea name="requiredFields" value={form.requiredFields} onChange={handleChange} rows={3} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none font-mono text-xs transition-colors" placeholder='["Jam Buka", "Alamat"]' />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex justify-between">
                    <span>Sample Questions</span>
                    <span className="text-xs font-mono text-slate-400">JSON Array</span>
                  </label>
                  <textarea name="sampleQuestions" value={form.sampleQuestions} onChange={handleChange} rows={3} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none font-mono text-xs transition-colors" placeholder='["Menu paling laris?", "Bisa pesan antar?"]' />
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-end gap-3">
              <button onClick={() => { setEditModal(null); setCreateModal(false); }} className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-colors">
                Batal
              </button>
              <button onClick={editModal ? handleUpdate : handleCreate} disabled={saving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:shadow-none transition-all">
                <Save className="w-4 h-4" /> {saving ? 'Memproses...' : 'Simpan Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={() => { if (deleteModal) handleDelete(deleteModal); }}
        title="Hapus Template Permanen"
        message={`Apakah Anda yakin ingin menghapus template "${deleteModal?.name}" secara permanen? Bot yang sudah menggunakan template ini mungkin perlu dikonfigurasi ulang.`}
      />
    </div>
  );
}
