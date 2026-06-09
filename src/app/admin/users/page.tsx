/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Users, Search, X } from 'lucide-react';

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
    if (
      currentRole === 'ADMIN' &&
      !confirm('Apakah Anda yakin ingin menurunkan role Admin ini?')
    )
      return;

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-indigo-600" />
          Users Management
        </h1>
        <p className="text-slate-500 mt-1">Daftar pengguna terdaftar di platform ChatBisnis AI.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {loading ? (
          <p className="text-slate-500 animate-pulse">Memuat...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 font-medium">Nama</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Status Bot & WAHA</th>
                  <th className="pb-3 font-medium">Data (Knowledge/Leads)</th>
                  <th className="pb-3 font-medium">Plan & Chats</th>
                  <th className="pb-3 font-medium">Tanggal Daftar</th>
                  <th className="pb-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => {
                  const botActive = u.chatbotSettings?.[0]?.isActive;
                  const wahaConnected = u.whatsappSessions?.some(
                    (s) => s.status === 'connected',
                  );
                  const sub = u.subscriptions?.[0];
                  
                  return (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="py-4">
                        <div className="font-medium text-slate-900">{u.name}</div>
                        <div className="text-slate-500 text-xs">{u.email}</div>
                      </td>
                      <td className="py-4">
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-medium ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`text-xs px-2 py-1 inline-block w-fit rounded ${botActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
                          >
                            Bot: {botActive ? 'Aktif' : 'Off'}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 inline-block w-fit rounded ${wahaConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                          >
                            WA: {wahaConnected ? 'Connected' : 'Disconnected'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col gap-1 text-sm text-slate-600">
                          <span>Knowledge: {u._count?.knowledgeItems || 0}</span>
                          <span>Leads: {u._count?.leads || 0}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-indigo-700">{sub?.plan?.name || 'Free'}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${sub?.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                              {sub?.status || 'active'}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">Chats this month: {u.chatsThisMonth || 0}</span>
                          {sub?.expiredAt && (
                            <span className="text-[10px] text-slate-400">
                              Exp: {new Date(sub.expiredAt).toLocaleDateString('id-ID')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-slate-500 text-sm">
                        {new Date(u.createdAt).toLocaleDateString('id-ID')}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex flex-col items-end gap-2">
                          <button
                            onClick={() => openSubModal(u)}
                            className="text-xs px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md font-medium transition-colors border border-indigo-100"
                          >
                            Ubah Paket
                          </button>
                          <button
                            onClick={() => toggleRole(u.id, u.role)}
                            className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium transition-colors"
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
    </div>
  );
}
