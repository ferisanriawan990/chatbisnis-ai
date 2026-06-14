'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { CreditCard, Edit2, Plus, X, Check, EyeOff, Sparkles, Server, MessageSquare, Briefcase, Trash2 } from 'lucide-react';

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<any[]>([]) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [formData, setFormData] = useState<any>({ // eslint-disable-line @typescript-eslint/no-explicit-any
    name: '', slug: '', priceMonthly: 0, maxWhatsappSessions: 1, 
    maxKnowledgeItems: 5, dailyChatLimit: 100, monthlyChatLimit: 3000,
    allowLeadCapture: false, allowHumanHandover: false,
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
        allowLeadCapture: false, allowHumanHandover: false,
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

  const handleDelete = async () => {
    if (!editingPlan) return;
    if (!confirm('Apakah Anda yakin ingin menghapus paket ini? Tindakan ini tidak dapat dibatalkan.')) return;
    
    try {
      const res = await fetch(`/api/admin/plans/${editingPlan.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete plan');
      
      toast.success('Paket berhasil dihapus');
      setIsModalOpen(false);
      void fetchPlans();
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-lg p-8 rounded-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden animate-in fade-in duration-700">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            Subscription Engine
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-lg ml-14">Konfigurasi paket berlangganan & limitasi fitur SaaS Anda.</p>
        </div>

        <button 
          onClick={() => handleOpenModal()}
          className="relative z-10 flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-500/30 hover:scale-105"
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
            <div key={p.id} className={`group relative bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 md:p-8 border transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 flex flex-col overflow-hidden ${p.isActive ? 'border-white/60 hover:border-indigo-200' : 'border-dashed border-white/40 opacity-75 grayscale-[50%]'}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-100/50 to-transparent rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110"></div>
              
              {/* Top Section */}
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">{p.name}</h3>
                  <div className="flex gap-2 mt-2">
                    <span className="bg-indigo-50 text-indigo-600 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md shadow-sm border border-indigo-100/50">
                      {p.slug}
                    </span>
                    {!p.isActive && (
                      <span className="bg-rose-50 text-rose-600 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md flex items-center gap-1 shadow-sm border border-rose-100/50">
                        <EyeOff className="w-3 h-3" /> HIDDEN
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => handleOpenModal(p)} className="bg-white/80 p-2.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm border border-slate-100">
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
              <div className="space-y-4 mb-6 flex-1 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-emerald-100 to-emerald-50 p-2 rounded-xl text-emerald-600 shadow-sm border border-emerald-100/50"><MessageSquare className="w-4 h-4" /></div>
                  <div className="flex-1">
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Monthly Chats</p>
                    <p className="text-sm font-extrabold text-slate-800">{p.monthlyChatLimit.toLocaleString('id-ID')} <span className="text-[10px] font-bold text-slate-400">({p.dailyChatLimit}/hari)</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-2 rounded-xl text-blue-600 shadow-sm border border-blue-100/50"><Server className="w-4 h-4" /></div>
                  <div className="flex-1">
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Knowledge Items</p>
                    <p className="text-sm font-extrabold text-slate-800">{p.maxKnowledgeItems} Items</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-purple-100 to-purple-50 p-2 rounded-xl text-purple-600 shadow-sm border border-purple-100/50"><Briefcase className="w-4 h-4" /></div>
                  <div className="flex-1">
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">WhatsApp Sesi</p>
                    <p className="text-sm font-extrabold text-slate-800">{p.maxWhatsappSessions} Device</p>
                  </div>
                </div>
              </div>
              
              {/* Feature Toggles */}
              <div className="bg-slate-50/80 backdrop-blur-sm rounded-2xl p-5 flex flex-col gap-3 border border-slate-100/50 relative z-10">
                <div className={`flex items-center gap-3 text-xs font-bold ${p.allowLeadCapture ? 'text-indigo-700' : 'text-slate-400'}`}>
                  {p.allowLeadCapture ? <div className="bg-indigo-100 p-1 rounded-md"><Check className="w-3.5 h-3.5" /></div> : <div className="bg-slate-100 p-1 rounded-md"><X className="w-3.5 h-3.5" /></div>} Auto Lead Capture
                </div>
                <div className={`flex items-center gap-3 text-xs font-bold ${p.allowHumanHandover ? 'text-indigo-700' : 'text-slate-400'}`}>
                  {p.allowHumanHandover ? <div className="bg-indigo-100 p-1 rounded-md"><Check className="w-3.5 h-3.5" /></div> : <div className="bg-slate-100 p-1 rounded-md"><X className="w-3.5 h-3.5" /></div>} Live Human Handover
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
                      <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-colors" placeholder="e.g. Pro, Premium" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Slug Unik (URL)</label>
                      <input type="text" required value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-colors font-mono text-sm" placeholder="e.g. pro" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Harga Berlangganan per Bulan</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <span className="text-slate-500 font-bold">Rp</span>
                        </div>
                        <input type="number" required value={formData.priceMonthly} onChange={e => setFormData({...formData, priceMonthly: e.target.value})} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-colors font-mono font-bold text-lg text-slate-800" placeholder="99000" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quotas */}
                <div>
                  <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Batas Kuota Sistem</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nomor WhatsApp (Device)</label>
                      <div className="relative">
                        <input type="number" required value={formData.maxWhatsappSessions} onChange={e => setFormData({...formData, maxWhatsappSessions: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-colors pr-20 font-bold" />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <span className="text-slate-400 text-sm font-medium">Nomor</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Item Knowledge Base</label>
                      <div className="relative">
                        <input type="number" required value={formData.maxKnowledgeItems} onChange={e => setFormData({...formData, maxKnowledgeItems: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-colors pr-20 font-bold" />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <span className="text-slate-400 text-sm font-medium">Items</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Chat AI / Hari (FUP)</label>
                      <div className="relative">
                        <input type="number" required value={formData.dailyChatLimit} onChange={e => setFormData({...formData, dailyChatLimit: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-colors pr-20 font-bold" />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <span className="text-slate-400 text-sm font-medium">Pesan</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Chat AI / Bulan</label>
                      <div className="relative">
                        <input type="number" required value={formData.monthlyChatLimit} onChange={e => setFormData({...formData, monthlyChatLimit: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-colors pr-20 font-bold" />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <span className="text-slate-400 text-sm font-medium">Pesan</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature Toggles */}
                <div>
                  <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Unlock Fitur Lanjutan</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-2xl cursor-pointer hover:bg-emerald-50 transition-colors">
                      <input type="checkbox" checked={formData.allowLeadCapture} onChange={e => setFormData({...formData, allowLeadCapture: e.target.checked})} className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" />
                      <span className="text-sm font-semibold text-slate-700">Auto Lead Capture</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-2xl cursor-pointer hover:bg-blue-50 transition-colors">
                      <input type="checkbox" checked={formData.allowHumanHandover} onChange={e => setFormData({...formData, allowHumanHandover: e.target.checked})} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                      <span className="text-sm font-semibold text-slate-700">Live Human Handover</span>
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
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between gap-3 rounded-b-3xl mt-auto">
                <div>
                  {editingPlan && (
                    <button type="button" onClick={handleDelete} className="px-6 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition-colors flex items-center gap-2">
                      <Trash2 className="w-5 h-5" /> Hapus Paket
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-bold transition-colors">Batal</button>
                  <button type="submit" className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 flex items-center gap-2">
                    <Check className="w-5 h-5" /> Simpan Konfigurasi
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
