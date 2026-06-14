"use client";

import React, { useState, useEffect } from 'react';
import { Star, MessageSquareQuote, TrendingUp, Users } from 'lucide-react';

type Testimonial = {
  id: string;
  customerName: string;
  customerPhone: string;
  rating: number;
  reviewText: string;
  createdAt: string;
};

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [stats, setStats] = useState({ average: '0.0', count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await fetch('/api/dashboard/testimonials');
        const data = await res.json();
        if (data.testimonials) {
          setTestimonials(data.testimonials);
          setStats(data.stats);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTestimonials();
  }, []);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} 
      />
    ));
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-lg p-8 rounded-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-orange-400/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 via-amber-900 to-slate-900 bg-clip-text text-transparent flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg shadow-amber-500/20">
              <Star className="w-8 h-8 text-white fill-white" />
            </div>
            Ulasan & Testimoni
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-lg ml-14">Kumpulan ulasan otomatis pasca-pembelian yang ditangkap oleh AI.</p>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 flex items-center gap-5 hover:shadow-xl hover:shadow-amber-100/50 transition-all group">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">Rata-rata Rating</p>
            <h3 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">{stats.average}</h3>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 flex items-center gap-5 hover:shadow-xl hover:shadow-blue-100/50 transition-all group">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <MessageSquareQuote className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">Total Ulasan Masuk</p>
            <h3 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{stats.count}</h3>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 flex items-center gap-5 hover:shadow-xl hover:shadow-emerald-100/50 transition-all group">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrendingUp className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">Sentimen Kepuasan</p>
            <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 mt-1">Sangat Baik</h3>
          </div>
        </div>
      </div>

      {/* Testimonials List */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 relative overflow-hidden group/list z-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-100/50 to-transparent rounded-bl-full pointer-events-none transition-transform duration-500 group-hover/list:scale-110"></div>
        <div className="p-6 md:p-8 border-b border-slate-100/50 flex items-center gap-3 relative z-10">
          <div className="p-2 bg-slate-100 rounded-xl">
            <Users className="w-5 h-5 text-slate-600" />
          </div>
          <h3 className="font-extrabold text-slate-800 text-lg">Daftar Suara Pelanggan</h3>
        </div>
        <div className="p-2 relative z-10">
          {loading ? (
            <div className="p-16 text-center text-slate-500">
              <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"></div>
              <span className="font-bold">Memuat ulasan...</span>
            </div>
          ) : testimonials.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <Star className="w-16 h-16 text-slate-200 fill-slate-200 mx-auto mb-4" />
              <p className="font-bold text-lg mb-2">Belum ada ulasan yang terkumpul.</p>
              <p className="text-sm">Ubah status pesanan menjadi &apos;Completed&apos; untuk memicu pesan ulasan ke WhatsApp pelanggan.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100/50">
              {testimonials.map((testi) => (
                <div key={testi.id} className="p-6 md:p-8 hover:bg-amber-50/40 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500 text-xl">
                        {(testi.customerName || 'C')[0].toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-lg">{testi.customerName || 'Customer'}</h4>
                        <p className="text-[11px] font-bold text-slate-500 mt-0.5">{testi.customerPhone} • {new Date(testi.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                      {renderStars(testi.rating)}
                    </div>
                  </div>
                  <p className="text-slate-700 font-medium italic leading-relaxed text-lg ml-16 relative">
                    <span className="absolute -left-6 -top-2 text-4xl text-amber-200 font-serif">&quot;</span>
                    {testi.reviewText || 'Memberikan rating tanpa komentar.'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
