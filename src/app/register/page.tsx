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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Toaster position="top-center" />
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Bot className="w-12 h-12 text-blue-600 mx-auto" />
        <h2 className="mt-6 text-3xl font-extrabold text-slate-900">Buat Akun Baru</h2>
        <p className="mt-2 text-sm text-slate-600">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Masuk di sini
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200 sm:rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700">Nama Lengkap</label>
              <input
                type="text"
                name="name"
                required
                minLength={2}
                value={form.name}
                onChange={handleChange}
                placeholder="Nama Anda"
                className="mt-1 block w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Alamat Email</label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="admin@bisnis.com"
                className="mt-1 block w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                value={form.password}
                onChange={handleChange}
                placeholder="Minimal 8 karakter"
                className="mt-1 block w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Konfirmasi Password</label>
              <input
                type="password"
                name="confirmPassword"
                required
                minLength={8}
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Ulangi password"
                className="mt-1 block w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
