'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Users, Search } from 'lucide-react';

interface WhatsAppSessionStatus {
  status: string;
  sessionName: string;
}

interface ChatbotSettingStatus {
  isActive: boolean;
  botName: string;
}

interface PlanInfo {
  name: string;
}

interface SubscriptionInfo {
  status: string;
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
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void fetchUsers(); }, [fetchUsers]);

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
                  <th className="pb-3 font-medium">Status Bot &amp; WAHA</th>
                  <th className="pb-3 font-medium">Plan</th>
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
                      <td className="py-4 font-medium text-sm">
                        {u.subscriptions?.[0]?.plan?.name || 'Free'}
                      </td>
                      <td className="py-4 text-slate-500 text-sm">
                        {new Date(u.createdAt).toLocaleDateString('id-ID')}
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => toggleRole(u.id, u.role)}
                          className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium transition-colors"
                        >
                          Ubah Role
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
