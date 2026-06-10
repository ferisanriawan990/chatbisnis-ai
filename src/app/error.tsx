'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertOctagon, RotateCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if available
    console.error('Global Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center max-w-md mx-auto relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-100/50 to-transparent rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110"></div>
        
        <div className="flex justify-center mb-6 relative z-10">
          <div className="p-4 bg-red-50 rounded-2xl">
            <AlertOctagon className="w-12 h-12 text-red-500" />
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-slate-800 mb-4 relative z-10">Terjadi Kesalahan Server</h2>
        <p className="text-slate-500 mb-8 relative z-10 leading-relaxed text-sm">
          Sistem mengalami masalah tidak terduga saat memproses permintaan Anda. Tim kami telah diberitahu.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center relative z-10">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors rounded-xl"
          >
            <RotateCcw className="w-4 h-4" /> Coba Lagi
          </button>
          
          <Link 
            href="/dashboard" 
            className="inline-flex items-center justify-center px-6 py-3 font-semibold text-white transition-all bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg"
          >
            Ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
