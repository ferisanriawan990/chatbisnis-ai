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
    <div className="max-w-7xl mx-auto space-y-8 pb-20 p-4 md:p-8 animate-in fade-in duration-700">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-lg p-8 rounded-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/20">
              <Shield className="w-8 h-8 text-white" />
            </div>
            Manajemen Tim & Hak Akses
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-lg ml-14">Kelola staf Customer Service atau Admin tambahan untuk toko Anda.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="relative z-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3.5 rounded-2xl font-bold shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" /> Tambah Staf
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 relative overflow-hidden group/list z-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100/50 to-transparent rounded-bl-full pointer-events-none transition-transform duration-500 group-hover/list:scale-110"></div>
        <div className="overflow-x-auto relative z-10 custom-scrollbar p-2">
          <table className="w-full text-left text-slate-600">
            <thead className="text-[11px] font-extrabold text-slate-500 uppercase border-b border-slate-100 tracking-wider">
              <tr>
                <th className="px-6 py-5">Nama Staf</th>
                <th className="px-6 py-5">Email / Username</th>
                <th className="px-6 py-5">Peran (Role)</th>
                <th className="px-6 py-5">Akses Ditambahkan</th>
                <th className="px-6 py-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500 font-bold animate-pulse">Memuat data tim...</td></tr>
              ) : team.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500 font-bold">Belum ada staf yang ditambahkan.</td></tr>
              ) : (
                team.map((t: any) => (
                  <tr key={t.id} className="hover:bg-blue-50/40 transition-colors group/row">
                    <td className="px-6 py-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 flex items-center justify-center font-extrabold text-lg shadow-inner">
                        {t.user?.name?.charAt(0).toUpperCase() || <User className="w-5 h-5"/>}
                      </div>
                      <span className="font-extrabold text-slate-800 text-lg">{t.user?.name}</span>
                    </td>
                    <td className="px-6 py-5 text-slate-600 font-medium">{t.user?.email}</td>
                    <td className="px-6 py-5">
                      <span className={`px-4 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${t.role?.name === 'Admin' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {t.role?.name || 'Staf'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-slate-500 font-medium text-sm">
                      {t.user?.createdAt ? format(new Date(t.user.createdAt), 'dd MMM yyyy') : '-'}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={() => handleDelete(t.id)}
                        className="text-red-500 hover:text-white hover:bg-red-500 p-2.5 rounded-xl transition-all shadow-sm border border-transparent hover:shadow-red-500/20"
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
