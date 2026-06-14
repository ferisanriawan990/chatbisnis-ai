/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Users, Search, X, Database } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';

interface WhatsAppSessionStatus {
  status: string;
  sessionName: string;
}

interface ChatbotSettingStatus {
  isActive: boolean;
  botName: string;
}

interface PlanInfo {
  id: string;
  name: string;
}

interface SubscriptionInfo {
  status: string;
  startedAt: string;
  expiredAt?: string | null;
  plan?: PlanInfo;
}

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  chatbotSettings?: ChatbotSettingStatus[];
  whatsappSessions?: WhatsAppSessionStatus[];
  subscriptions?: SubscriptionInfo[];
  _count?: {
    knowledgeItems: number;
    leads: number;
  };
  chatsThisMonth?: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);
  const [subFormData, setSubFormData] = useState({
    planId: '',
    status: 'active',
    startedAt: new Date().toISOString().split('T')[0],
    expiredAt: '',
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    userId: string;
    currentRole: string;
  }>({ isOpen: false, userId: '', currentRole: '' });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal memuat users');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/plans');
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } catch (e) {
      console.error('Failed to fetch plans', e);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
    void fetchPlans();
  }, [fetchUsers, fetchPlans]);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';

    if (currentRole === 'ADMIN') {
      setConfirmModal({ isOpen: true, userId, currentRole });
      return;
    }
    
    await executeToggleRole(userId, newRole);
  };

  const executeToggleRole = async (userId: string, newRole: string) => {

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update role');
      toast.success('Role berhasil diubah');
      fetchUsers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal mengubah role');
    }
  };

  const openSubModal = (user: AdminUserRow) => {
    setSelectedUser(user);
    const sub = user.subscriptions?.[0];
    setSubFormData({
      planId: sub?.plan?.id || (plans.length > 0 ? plans[0].id : ''),
      status: sub?.status || 'active',
      startedAt: sub?.startedAt ? new Date(sub.startedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      expiredAt: sub?.expiredAt ? new Date(sub.expiredAt).toISOString().split('T')[0] : '',
    });
    setIsSubModalOpen(true);
  };

  const saveSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: subFormData.planId,
          status: subFormData.status,
          startedAt: subFormData.startedAt ? new Date(subFormData.startedAt).toISOString() : null,
          expiredAt: subFormData.expiredAt ? new Date(subFormData.expiredAt).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save subscription');
      toast.success('Subscription berhasil diperbarui');
      setIsSubModalOpen(false);
      fetchUsers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menyimpan subscription');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-lg p-8 rounded-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20">
              <Users className="w-8 h-8 text-white" />
            </div>
            Users Management
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-lg ml-14">Kelola daftar pengguna terdaftar di platform ChatBisnis AI.</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 space-y-6 relative z-10 group/list overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-100/50 to-transparent rounded-bl-full pointer-events-none transition-transform duration-500 group-hover/list:scale-110"></div>
        <div className="relative max-w-md z-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white/50 border border-slate-200/60 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all focus:bg-white"
          />
        </div>

        {loading ? (
          <p className="text-slate-500 animate-pulse">Memuat...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm relative z-10">
              <thead>
                <tr className="border-b border-slate-100/50 text-slate-500">
                  <th className="pb-4 px-2 font-bold uppercase tracking-wider text-[11px]">Nama</th>
                  <th className="pb-4 px-2 font-bold uppercase tracking-wider text-[11px]">Role</th>
                  <th className="pb-4 px-2 font-bold uppercase tracking-wider text-[11px]">Bot & WhatsApp</th>
                  <th className="pb-4 px-2 font-bold uppercase tracking-wider text-[11px]">Data (KB/Leads)</th>
                  <th className="pb-4 px-2 font-bold uppercase tracking-wider text-[11px]">Plan & Chats</th>
                  <th className="pb-4 px-2 font-bold uppercase tracking-wider text-[11px]">Terdaftar</th>
                  <th className="pb-4 px-2 font-bold uppercase tracking-wider text-[11px] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {filtered.map((u) => {
                  const botActive = u.chatbotSettings?.[0]?.isActive;
                  const whatsappConnected = u.whatsappSessions?.some(
                    (s) => s.status === 'connected',
                  );
                  const sub = u.subscriptions?.[0];
                  
                  return (
                    <tr key={u.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="py-5 px-2">
                        <div className="font-extrabold text-slate-800">{u.name}</div>
                        <div className="text-slate-500 text-xs font-medium">{u.email}</div>
                      </td>
                      <td className="py-5 px-2">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-5 px-2">
                        <div className="flex flex-col gap-1.5">
                          <span
                            className={`text-[10px] px-2.5 py-1 inline-block w-fit rounded-full font-bold shadow-sm ${botActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                          >
                            Bot: {botActive ? 'Aktif' : 'Off'}
                          </span>
                          <span
                            className={`text-[10px] px-2.5 py-1 inline-block w-fit rounded-full font-bold shadow-sm ${whatsappConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                          >
                            WA: {whatsappConnected ? 'Connected' : 'Disconnected'}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-2">
                        <div className="flex flex-col gap-1 text-sm font-medium text-slate-600">
                          <span className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5 text-blue-400" /> {u._count?.knowledgeItems || 0} KB</span>
                          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-indigo-400" /> {u._count?.leads || 0} Leads</span>
                        </div>
                      </td>
                      <td className="py-5 px-2">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{sub?.plan?.name || 'Free'}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${sub?.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                              {sub?.status || 'active'}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-slate-500">Chats: {u.chatsThisMonth || 0}</span>
                          {sub?.expiredAt && (
                            <span className="text-[10px] font-medium text-amber-600/80">
                              Exp: {new Date(sub.expiredAt).toLocaleDateString('id-ID')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-5 px-2 text-slate-500 text-xs font-medium">
                        {new Date(u.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </td>
                      <td className="py-5 px-2 text-right">
                        <div className="flex flex-col items-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openSubModal(u)}
                            className="text-xs px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-bold shadow-md shadow-indigo-500/20 transition-all hover:scale-105"
                          >
                            Ubah Paket
                          </button>
                          <button
                            onClick={() => toggleRole(u.id, u.role)}
                            className="text-[10px] px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-bold transition-all border border-slate-200/60 shadow-sm"
                          >
                            Ubah Role
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isSubModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold">Ubah Paket User</h3>
                <p className="text-sm text-slate-500">{selectedUser.name} ({selectedUser.email})</p>
              </div>
              <button onClick={() => setIsSubModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={saveSubscription} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Paket (Plan)</label>
                <select 
                  required 
                  value={subFormData.planId} 
                  onChange={e => setSubFormData({...subFormData, planId: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" disabled>Pilih Plan...</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status Subscription</label>
                <select 
                  required 
                  value={subFormData.status} 
                  onChange={e => setSubFormData({...subFormData, status: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Mulai (Started At)</label>
                <input 
                  type="date" 
                  required 
                  value={subFormData.startedAt} 
                  onChange={e => setSubFormData({...subFormData, startedAt: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Berakhir (Expired At)</label>
                <input 
                  type="date" 
                  value={subFormData.expiredAt} 
                  onChange={e => setSubFormData({...subFormData, expiredAt: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-slate-500 mt-1">Kosongkan jika paket berlaku selamanya (seperti Free plan).</p>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsSubModalOpen(false)} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium">Batal</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={() => executeToggleRole(confirmModal.userId, 'USER')}
        title="Ubah Role Admin"
        message="Apakah Anda yakin ingin menurunkan role Admin ini?"
      />
    </div>
  );
}
