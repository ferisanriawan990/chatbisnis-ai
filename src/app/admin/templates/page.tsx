'use client';

import { useState, useEffect, useCallback } from 'react';
import { Layers, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Users, X, Save } from 'lucide-react';
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

  if (loading) return <div className="flex items-center justify-center h-64"><span className="animate-pulse font-medium text-indigo-500">Memuat template...</span></div>;

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Layers className="w-7 h-7 text-indigo-500" /> Business Templates</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola template chatbot untuk berbagai jenis usaha.</p>
        </div>
        <button onClick={() => { setForm(EMPTY_TEMPLATE); setCreateModal(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> Tambah Template
        </button>
      </div>

      {/* Template Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Nama</th>
              <th className="px-4 py-3 text-left font-medium">Kategori</th>
              <th className="px-4 py-3 text-center font-medium">User</th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {templates.map(tmpl => (
              <tr key={tmpl.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-800">{tmpl.name}</div>
                  <div className="text-xs text-slate-400">{tmpl.slug}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">{tmpl.category}</td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                    <Users className="w-3 h-3" /> {tmpl._count?.botConfigs || 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => handleToggle(tmpl)}>
                    {tmpl.isActive
                      ? <ToggleRight className="w-6 h-6 text-emerald-500 inline" />
                      : <ToggleLeft className="w-6 h-6 text-slate-300 inline" />
                    }
                  </button>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => openEdit(tmpl)} className="text-indigo-500 hover:text-indigo-700"><Pencil className="w-4 h-4 inline" /></button>
                  <button onClick={() => setDeleteModal(tmpl)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4 inline" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Create / Edit */}
      {(createModal || editModal) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800">{editModal ? 'Edit Template' : 'Tambah Template Baru'}</h2>
              <button onClick={() => { setEditModal(null); setCreateModal(false); }} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Nama *</label><input name="name" value={form.name} onChange={handleChange} className="w-full p-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Slug *</label><input name="slug" value={form.slug} onChange={handleChange} className="w-full p-2 border rounded-lg" disabled={!!editModal} /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Kategori *</label><input name="category" value={form.category} onChange={handleChange} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Deskripsi</label><textarea name="description" value={form.description} onChange={handleChange} rows={2} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">System Prompt *</label><textarea name="systemPrompt" value={form.systemPrompt} onChange={handleChange} rows={6} className="w-full p-2 border rounded-lg font-mono text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">Required Fields (JSON array)</label><textarea name="requiredFields" value={form.requiredFields} onChange={handleChange} rows={2} className="w-full p-2 border rounded-lg font-mono text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">Sample Questions (JSON array)</label><textarea name="sampleQuestions" value={form.sampleQuestions} onChange={handleChange} rows={2} className="w-full p-2 border rounded-lg font-mono text-sm" /></div>
              <div className="flex justify-end gap-3">
                <button onClick={() => { setEditModal(null); setCreateModal(false); }} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium">Batal</button>
                <button onClick={editModal ? handleUpdate : handleCreate} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50">
                  <Save className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={() => { if (deleteModal) handleDelete(deleteModal); }}
        title="Hapus Template"
        message={`Hapus template "${deleteModal?.name}"? Ini tidak bisa dibatalkan.`}
      />
    </div>
  );
}
