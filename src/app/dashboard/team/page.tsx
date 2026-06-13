'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Trash2, Shield, User, X } from 'lucide-react';
import { format } from 'date-fns';

export default function TeamManagementPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleName, setRoleName] = useState('Customer Service');

  const fetchTeam = useCallback(() => {
    setLoading(true);
    fetch('/api/dashboard/team')
      .then(res => res.json())
      .then(data => {
        setTeam(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/dashboard/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, roleName })
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Gagal menambahkan staf');
      } else {
        alert('Staf berhasil ditambahkan!');
        setShowAddModal(false);
        setName(''); setEmail(''); setPassword(''); setRoleName('Customer Service');
        fetchTeam();
      }
    } catch (err) {
      alert('Terjadi kesalahan server');
    }
    setSubmitting(false);
  };

  const handleDelete = async (assignmentId: string) => {
    if (!confirm('Apakah Anda yakin ingin mencabut akses staf ini?')) return;
    try {
      const res = await fetch(`/api/dashboard/team/${assignmentId}`, { method: 'DELETE' });
      if (res.ok) fetchTeam();
      else alert('Gagal menghapus staf');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" /> Manajemen Tim & Hak Akses
          </h1>
          <p className="text-slate-500 mt-1">Kelola staf Customer Service atau Admin tambahan untuk toko Anda.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
        >
          <UserPlus className="w-5 h-5" /> Tambah Staf
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm border-b">
              <tr>
                <th className="py-4 px-6 font-medium">Nama Staf</th>
                <th className="py-4 px-6 font-medium">Email / Username</th>
                <th className="py-4 px-6 font-medium">Peran (Role)</th>
                <th className="py-4 px-6 font-medium">Akses Ditambahkan</th>
                <th className="py-4 px-6 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-500">Memuat data tim...</td></tr>
              ) : team.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-500">Belum ada staf yang ditambahkan.</td></tr>
              ) : (
                team.map((t: any) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        {t.user?.name?.charAt(0).toUpperCase() || <User className="w-5 h-5"/>}
                      </div>
                      <span className="font-semibold text-slate-800">{t.user?.name}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-600">{t.user?.email}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${t.role?.name === 'Admin' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                        {t.role?.name || 'Staf'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500 text-sm">
                      {t.user?.createdAt ? format(new Date(t.user.createdAt), 'dd MMM yyyy') : '-'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => handleDelete(t.id)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Cabut Akses"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg flex items-center gap-2"><UserPlus className="w-5 h-5 text-blue-600"/> Tambah Staf Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleAddStaff} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                <input type="text" required value={name} onChange={e=>setName(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Budi Santoso" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email / Username Login</label>
                <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="budi@toko.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password Sementara</label>
                <input type="text" required value={password} onChange={e=>setPassword(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Minimal 6 karakter" minLength={6} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Peran (Role)</label>
                <select value={roleName} onChange={e=>setRoleName(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                  <option value="Customer Service">Customer Service (Hanya membalas chat)</option>
                  <option value="Admin">Admin (Bisa edit bot & produk)</option>
                </select>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2 rounded-xl font-medium text-slate-600 hover:bg-slate-100">Batal</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? 'Menyimpan...' : 'Simpan Staf'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
