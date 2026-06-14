'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, UserPlus } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password minimal 8 karakter');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success('Akun berhasil dibuat! Mengalihkan ke login...');
        setTimeout(() => router.push('/login'), 1500);
      } else {
        toast.error(data.error || 'Gagal mendaftar');
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden animate-in fade-in duration-700">
      {/* Animated Premium Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full opacity-60 pointer-events-none -z-10">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-400/20 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 w-[600px] h-[600px] bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-[120px] animate-blob animation-delay-4000"></div>
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-400/20 rounded-full mix-blend-multiply filter blur-[100px] animate-blob"></div>
      </div>

      <Toaster position="top-center" />
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30 group hover:scale-105 transition-transform duration-300">
          <Bot className="w-8 h-8 text-white group-hover:rotate-12 transition-transform duration-300" />
        </div>
        <h2 className="mt-6 text-4xl font-black text-slate-900 tracking-tight">Buat Akun Baru</h2>
        <p className="mt-3 text-base text-slate-600 font-medium">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline transition-all">
            Masuk di sini
          </Link>
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/60 backdrop-blur-xl py-10 px-6 sm:px-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-[2rem] border border-white/80 relative overflow-hidden group">
          {/* Subtle inner glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-100/50 to-transparent rounded-bl-full pointer-events-none -z-10 group-hover:scale-110 transition-transform duration-500"></div>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nama Lengkap</label>
              <input
                type="text"
                name="name"
                required
                minLength={2}
                value={form.name}
                onChange={handleChange}
                placeholder="Nama Anda"
                className="block w-full px-4 py-3.5 bg-white/80 border border-slate-200/60 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all hover:bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Alamat Email</label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="admin@bisnis.com"
                className="block w-full px-4 py-3.5 bg-white/80 border border-slate-200/60 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all hover:bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                value={form.password}
                onChange={handleChange}
                placeholder="Minimal 8 karakter"
                className="block w-full px-4 py-3.5 bg-white/80 border border-slate-200/60 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all hover:bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Konfirmasi Password</label>
              <input
                type="password"
                name="confirmPassword"
                required
                minLength={8}
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Ulangi password"
                className="block w-full px-4 py-3.5 bg-white/80 border border-slate-200/60 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all hover:bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 mt-8"
            >
              <UserPlus className="w-5 h-5" />
              {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
