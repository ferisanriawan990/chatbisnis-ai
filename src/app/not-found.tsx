import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center max-w-md mx-auto relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-100/50 to-transparent rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110"></div>
        
        <div className="flex justify-center mb-6 relative z-10">
          <div className="p-4 bg-amber-50 rounded-2xl">
            <AlertCircle className="w-12 h-12 text-amber-500" />
          </div>
        </div>
        
        <h1 className="text-3xl font-extrabold text-slate-800 mb-2 relative z-10">404</h1>
        <h2 className="text-xl font-bold text-slate-700 mb-4 relative z-10">Halaman Tidak Ditemukan</h2>
        <p className="text-slate-500 mb-8 relative z-10 leading-relaxed">
          Maaf, halaman yang Anda cari tidak ada atau mungkin telah dipindahkan.
        </p>
        
        <Link 
          href="/dashboard" 
          className="inline-flex items-center justify-center px-6 py-3 font-semibold text-white transition-all bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg relative z-10"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
