'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { CreditCard, Edit2, Plus, X, Check, EyeOff, Sparkles, Server, MessageSquare, Briefcase } from 'lucide-react';

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

  const fetchPlans = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchPlans();
  }, [fetchPlans]);

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
      void fetchPlans();
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-[0_2px_20px_-10px_rgba(0,0,0,0.05)]">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
            <div className="bg-indigo-100 p-2.5 rounded-2xl"><CreditCard className="w-7 h-7 text-indigo-600" /></div>
            Subscription Engine
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Konfigurasi paket berlangganan & limitasi fitur SaaS Anda.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/30 hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" /> Buat Plan Baru
        </button>
      </div>

      {/* Grid of Plans */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Sparkles className="w-10 h-10 text-indigo-400 animate-spin" />
          <p className="text-slate-500 font-medium">Memuat konfigurasi paket...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {plans.map(p => (
            <div key={p.id} className={`group relative bg-white rounded-3xl p-6 md:p-8 border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 flex flex-col ${p.isActive ? 'border-slate-100 hover:border-indigo-200' : 'border-dashed border-slate-200 opacity-75 grayscale-[50%]'}`}>
              {/* Top Section */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">{p.name}</h3>
                  <div className="flex gap-2 mt-2">
                    <span className="bg-slate-100 text-slate-500 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md">
                      {p.slug}
                    </span>
                    {!p.isActive && (
                      <span className="bg-red-50 text-red-600 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md flex items-center gap-1">
                        <EyeOff className="w-3 h-3" /> HIDDEN
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => handleOpenModal(p)} className="bg-slate-50 p-2.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              
              {/* Pricing */}
              <div className="mb-6 pb-6 border-b border-slate-100">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black tracking-tight text-slate-900">Rp {(p.priceMonthly/1000).toLocaleString('id-ID')}</span>
                  <span className="text-xl font-bold text-slate-900">k</span>
                  <span className="text-sm font-medium text-slate-400 ml-1">/bln</span>
                </div>
              </div>

              {/* Core Limits */}
              <div className="space-y-4 mb-6 flex-1">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-50 p-1.5 rounded-lg text-emerald-600"><MessageSquare className="w-4 h-4" /></div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 font-medium">Monthly Chats</p>
                    <p className="text-sm font-bold text-slate-800">{p.monthlyChatLimit.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-400">({p.dailyChatLimit}/hari)</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600"><Server className="w-4 h-4" /></div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 font-medium">Knowledge Items</p>
                    <p className="text-sm font-bold text-slate-800">{p.maxKnowledgeItems} Items</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-purple-50 p-1.5 rounded-lg text-purple-600"><Briefcase className="w-4 h-4" /></div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 font-medium">WhatsApp Sesi</p>
                    <p className="text-sm font-bold text-slate-800">{p.maxWhatsappSessions} Device</p>
                  </div>
                </div>
              </div>
              
              {/* Feature Toggles */}
              <div className="bg-slate-50 rounded-2xl p-4 flex flex-col gap-2.5">
                <div className={`flex items-center gap-2 text-xs font-semibold ${p.allowN8nTemplates ? 'text-indigo-700' : 'text-slate-400'}`}>
                  {p.allowN8nTemplates ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} Webhook & n8n Support
                </div>
                <div className={`flex items-center gap-2 text-xs font-semibold ${p.allowLeadCapture ? 'text-indigo-700' : 'text-slate-400'}`}>
                  {p.allowLeadCapture ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} AI Auto Lead Capture
                </div>
                <div className={`flex items-center gap-2 text-xs font-semibold ${p.allowHumanHandover ? 'text-indigo-700' : 'text-slate-400'}`}>
                  {p.allowHumanHandover ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} Live Human Handover
                </div>
                <div className={`flex items-center gap-2 text-xs font-semibold ${p.allowCustomApiKey ? 'text-indigo-700' : 'text-slate-400'}`}>
                  {p.allowCustomApiKey ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} Custom API Key
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modern Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-indigo-500" />
                {editingPlan ? 'Edit Konfigurasi Paket' : 'Desain Paket Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="bg-white p-2 text-slate-400 hover:text-slate-700 border border-slate-200 rounded-full hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto">
              <div className="p-6 md:p-8 space-y-8">
                
                {/* General Settings */}
                <div>
                  <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Identitas Paket</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Plan</label>
                      <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-colors" placeholder="e.g. Pro, Premium" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Slug Unik (Tanpa Spasi)</label>
                      <input type="text" required value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-colors font-mono text-sm" placeholder="e.g. pro" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Harga Berlangganan per Bulan (Rp)</label>
                      <input type="number" required value={formData.priceMonthly} onChange={e => setFormData({...formData, priceMonthly: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-colors font-mono" placeholder="99000" />
                    </div>
                  </div>
                </div>

                {/* Quotas */}
                <div>
                  <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Batas Kuota Sistem</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Maksimal Sesi WhatsApp (Device)</label>
                      <input type="number" required value={formData.maxWhatsappSessions} onChange={e => setFormData({...formData, maxWhatsappSessions: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Maksimal Dokumen Pengetahuan (KB)</label>
                      <input type="number" required value={formData.maxKnowledgeItems} onChange={e => setFormData({...formData, maxKnowledgeItems: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Limit Chat / Hari (FUP Harian)</label>
                      <input type="number" required value={formData.dailyChatLimit} onChange={e => setFormData({...formData, dailyChatLimit: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Total Kuota Chat / Bulan</label>
                      <input type="number" required value={formData.monthlyChatLimit} onChange={e => setFormData({...formData, monthlyChatLimit: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-colors" />
                    </div>
                  </div>
                </div>

                {/* Feature Toggles */}
                <div>
                  <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Unlock Fitur Lanjutan</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-2xl cursor-pointer hover:bg-indigo-50 transition-colors">
                      <input type="checkbox" checked={formData.allowN8nTemplates} onChange={e => setFormData({...formData, allowN8nTemplates: e.target.checked})} className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                      <span className="text-sm font-semibold text-slate-700">Akses Webhook & n8n</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-2xl cursor-pointer hover:bg-emerald-50 transition-colors">
                      <input type="checkbox" checked={formData.allowLeadCapture} onChange={e => setFormData({...formData, allowLeadCapture: e.target.checked})} className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" />
                      <span className="text-sm font-semibold text-slate-700">AI Lead Capture</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-2xl cursor-pointer hover:bg-blue-50 transition-colors">
                      <input type="checkbox" checked={formData.allowHumanHandover} onChange={e => setFormData({...formData, allowHumanHandover: e.target.checked})} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                      <span className="text-sm font-semibold text-slate-700">Live Human Handover</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-2xl cursor-pointer hover:bg-purple-50 transition-colors">
                      <input type="checkbox" checked={formData.allowCustomApiKey} onChange={e => setFormData({...formData, allowCustomApiKey: e.target.checked})} className="w-5 h-5 text-purple-600 rounded border-slate-300 focus:ring-purple-500" />
                      <span className="text-sm font-semibold text-slate-700">Custom OpenAI Key</span>
                    </label>
                  </div>
                </div>
                
                {/* Status */}
                <div className="pt-4 border-t border-slate-100">
                  <label className="flex items-center justify-between p-5 bg-slate-900 rounded-2xl cursor-pointer shadow-lg shadow-slate-900/10">
                    <div>
                      <span className="text-base font-bold text-white block">Tampilkan Paket ke Publik</span>
                      <span className="text-xs text-slate-400 mt-1 block">Matikan jika paket ini disembunyikan/diarsipkan.</span>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-3xl mt-auto">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-bold transition-colors">Batal</button>
                <button type="submit" className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 flex items-center gap-2">
                  <Check className="w-5 h-5" /> Simpan Konfigurasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
