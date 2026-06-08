'use client';

import { useSearchParams } from 'next/navigation';
import { Bot, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: Record<string, string> = {
    CredentialsSignin: 'Email atau password salah. Silakan coba lagi.',
    SessionRequired: 'Anda harus login terlebih dahulu untuk mengakses halaman ini.',
    Default: 'Terjadi kesalahan autentikasi. Silakan coba lagi.',
  };

  const message = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Akses Ditolak</h2>
        <p className="text-slate-600 mb-8">{message}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
          >
            <Bot className="w-4 h-4" /> Kembali ke Login
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-all"
          >
            Halaman Utama
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><span className="animate-pulse text-slate-500">Memuat...</span></div>}>
      <ErrorContent />
    </Suspense>
  );
}
