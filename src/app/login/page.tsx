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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Toaster position="top-center" />
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Bot className="w-12 h-12 text-blue-600 mx-auto" />
        <h2 className="mt-6 text-3xl font-extrabold text-slate-900">Masuk ke Akun Anda</h2>
        <p className="mt-2 text-sm text-slate-600">
          Belum punya akun?{' '}
          <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
            Daftar gratis
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200 sm:rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!requires2FA ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Alamat Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@bisnis.com"
                    className="mt-1 block w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1 block w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700">Kode Autentikasi (2FA)</label>
                <p className="text-xs text-slate-500 mb-2">Buka aplikasi Google Authenticator Anda dan masukkan 6 digit kode.</p>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="mt-1 block w-full px-3 py-3 border border-slate-300 rounded-lg shadow-sm text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Memproses...' : (requires2FA ? 'Verifikasi & Masuk' : 'Masuk ke Dashboard')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
