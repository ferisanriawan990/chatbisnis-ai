'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Bot, LogIn } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        redirect: false,
        email: email.toLowerCase().trim(),
        password,
      };
      
      if (requires2FA && totpCode) {
        payload.totpCode = totpCode;
      }

      const res = await signIn('credentials', payload);

      if (res?.error) {
        if (res.error === '2FA_REQUIRED') {
          setRequires2FA(true);
          toast('Akun ini dilindungi 2FA. Silakan masukkan kode OTP.', { icon: '🔒' });
        } else {
          toast.error(res.error === 'Kode 2FA tidak valid' ? res.error : 'Email atau password salah');
        }
      } else {
        toast.success('Berhasil masuk!');
        router.push('/dashboard/chatbot');
        router.refresh();
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden animate-in fade-in duration-700">
      {/* Animated Premium Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full opacity-60 pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-400/20 rounded-full mix-blend-multiply filter blur-[100px] animate-blob"></div>
        <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 w-[600px] h-[600px] bg-purple-400/20 rounded-full mix-blend-multiply filter blur-[120px] animate-blob animation-delay-4000"></div>
      </div>

      <Toaster position="top-center" />
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30 group hover:scale-105 transition-transform duration-300">
          <Bot className="w-8 h-8 text-white group-hover:rotate-12 transition-transform duration-300" />
        </div>
        <h2 className="mt-6 text-4xl font-black text-slate-900 tracking-tight">Masuk ke Akun Anda</h2>
        <p className="mt-3 text-base text-slate-600 font-medium">
          Belum punya akun?{' '}
          <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline transition-all">
            Daftar gratis
          </Link>
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/60 backdrop-blur-xl py-10 px-6 sm:px-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-[2rem] border border-white/80 relative overflow-hidden group">
          {/* Subtle inner glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-100/50 to-transparent rounded-bl-full pointer-events-none -z-10 group-hover:scale-110 transition-transform duration-500"></div>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!requires2FA ? (
              <>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Alamat Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@bisnis.com"
                    className="block w-full px-4 py-3.5 bg-white/80 border border-slate-200/60 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all hover:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full px-4 py-3.5 bg-white/80 border border-slate-200/60 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all hover:bg-white"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Kode Autentikasi (2FA)</label>
                <p className="text-sm text-slate-500 mb-4 font-medium">Buka aplikasi Google Authenticator Anda dan masukkan 6 digit kode.</p>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="block w-full px-4 py-4 bg-white/80 border border-slate-200/60 rounded-xl shadow-sm text-center text-3xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:bg-white"
                />
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 mt-8"
            >
              <LogIn className="w-5 h-5" />
              {loading ? 'Memproses...' : (requires2FA ? 'Verifikasi & Masuk' : 'Masuk ke Dashboard')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
