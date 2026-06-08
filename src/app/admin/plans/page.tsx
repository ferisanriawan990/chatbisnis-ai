
'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CreditCard, Edit2, Plus, X } from 'lucide-react';

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<any[]>([]) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [formData, setFormData] = useState<any>({ // eslint-disable-line @typescript-eslint/no-explicit-any
    name: '', slug: '', priceMonthly: 0, maxWhatsappSessions: 1, 
    maxKnowledgeItems: 5, dailyChatLimit: 100, monthlyChatLimit: 3000,
    allowN8nTemplates: false, allowLeadCapture: false, allowHumanHandover: false, allowCustomApiKey: false,
    isActive: true
  });

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/admin/plans');
      if (!res.ok) throw new Error('Failed to fetch plans');
      const data = await res.json();
      setPlans(data);
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPlans();
  }, []);

  const handleOpenModal = (plan: any = null) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (plan) {
      setEditingPlan(plan);
      setFormData({ ...plan });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '', slug: '', priceMonthly: 0, maxWhatsappSessions: 1, 
        maxKnowledgeItems: 5, dailyChatLimit: 100, monthlyChatLimit: 3000,
        allowN8nTemplates: false, allowLeadCapture: false, allowHumanHandover: false, allowCustomApiKey: false,
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPlan ? `/api/admin/plans/${editingPlan.id}` : '/api/admin/plans';
      const method = editingPlan ? 'PATCH' : 'POST';
      
      const payload = { ...formData };
      payload.priceMonthly = Number(payload.priceMonthly);
      payload.maxWhatsappSessions = Number(payload.maxWhatsappSessions);
      payload.maxKnowledgeItems = Number(payload.maxKnowledgeItems);
      payload.dailyChatLimit = Number(payload.dailyChatLimit);
      payload.monthlyChatLimit = Number(payload.monthlyChatLimit);

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save plan');
      
      toast.success(`Plan berhasil ${editingPlan ? 'diperbarui' : 'dibuat'}`);
      setIsModalOpen(false);
      fetchPlans();
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-600" />
            Subscription Plans
          </h1>
          <p className="text-slate-500 mt-1">Daftar paket berlangganan untuk layanan ChatBisnis AI.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Tambah Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? <p>Memuat...</p> : plans.map(p => (
          <div key={p.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{p.name}</h3>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {p.isActive ? 'Active' : 'Archived'}
                </span>
              </div>
              <button onClick={() => handleOpenModal(p)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mb-6 flex-1">
              <div className="text-2xl font-bold text-slate-900 mb-4">
                Rp {p.priceMonthly.toLocaleString('id-ID')} <span className="text-sm font-normal text-slate-500">/bln</span>
              </div>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex justify-between border-b border-slate-50 pb-1"><span>WhatsApp Sessions:</span> <span className="font-semibold">{p.maxWhatsappSessions}</span></li>
                <li className="flex justify-between border-b border-slate-50 pb-1"><span>Knowledge Base:</span> <span className="font-semibold">{p.maxKnowledgeItems}</span></li>
                <li className="flex justify-between border-b border-slate-50 pb-1"><span>Daily Chat Limit:</span> <span className="font-semibold">{p.dailyChatLimit}</span></li>
                <li className="flex justify-between border-b border-slate-50 pb-1"><span>Monthly Chat Limit:</span> <span className="font-semibold">{p.monthlyChatLimit}</span></li>
              </ul>
              
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-1 text-xs text-slate-500">
                {p.allowN8nTemplates && <span className="flex items-center gap-1 text-indigo-600">✓ n8n Webhook Support</span>}
                {p.allowLeadCapture && <span className="flex items-center gap-1 text-emerald-600">✓ Lead Capture</span>}
                {p.allowHumanHandover && <span className="flex items-center gap-1 text-blue-600">✓ Human Handover</span>}
                {p.allowCustomApiKey && <span className="flex items-center gap-1 text-purple-600">✓ Custom AI Key</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold">{editingPlan ? 'Edit Plan' : 'Tambah Plan Baru'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Plan</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Slug (unik)</label>
                  <input type="text" required value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Harga Bulanan (Rp)</label>
                  <input type="number" required value={formData.priceMonthly} onChange={e => setFormData({...formData, priceMonthly: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max WA Sessions</label>
                  <input type="number" required value={formData.maxWhatsappSessions} onChange={e => setFormData({...formData, maxWhatsappSessions: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Knowledge Items</label>
                  <input type="number" required value={formData.maxKnowledgeItems} onChange={e => setFormData({...formData, maxKnowledgeItems: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Daily Chat Limit</label>
                  <input type="number" required value={formData.dailyChatLimit} onChange={e => setFormData({...formData, dailyChatLimit: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Chat Limit</label>
                  <input type="number" required value={formData.monthlyChatLimit} onChange={e => setFormData({...formData, monthlyChatLimit: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg" />
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                  <label className="text-sm font-medium text-slate-700">Active</label>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-4 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.allowN8nTemplates} onChange={e => setFormData({...formData, allowN8nTemplates: e.target.checked})} />
                  <label className="text-sm text-slate-700">Allow n8n Webhook</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.allowLeadCapture} onChange={e => setFormData({...formData, allowLeadCapture: e.target.checked})} />
                  <label className="text-sm text-slate-700">Allow Lead Capture</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.allowHumanHandover} onChange={e => setFormData({...formData, allowHumanHandover: e.target.checked})} />
                  <label className="text-sm text-slate-700">Allow Human Handover</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.allowCustomApiKey} onChange={e => setFormData({...formData, allowCustomApiKey: e.target.checked})} />
                  <label className="text-sm text-slate-700">Allow Custom AI Key</label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium">Batal</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
