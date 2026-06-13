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
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
            Ulasan & Testimoni
          </h1>
          <p className="text-slate-500 text-sm mt-1">Kumpulan ulasan otomatis pasca-pembelian yang ditangkap oleh AI.</p>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center">
            <Star className="w-7 h-7 text-amber-500 fill-amber-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Rata-rata Rating</p>
            <h3 className="text-3xl font-bold text-slate-800">{stats.average}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center">
            <MessageSquareQuote className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Ulasan Masuk</p>
            <h3 className="text-3xl font-bold text-slate-800">{stats.count}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center">
            <TrendingUp className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Sentimen Kepuasan</p>
            <h3 className="text-xl font-bold text-slate-800 mt-1">Sangat Baik</h3>
          </div>
        </div>
      </div>

      {/* Testimonials List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <Users className="w-5 h-5 text-slate-500" />
          <h3 className="font-bold text-slate-800">Daftar Suara Pelanggan</h3>
        </div>
        <div className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-500 animate-pulse">Memuat ulasan...</div>
          ) : testimonials.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Star className="w-12 h-12 text-slate-200 fill-slate-200 mx-auto mb-3" />
              Belum ada ulasan yang terkumpul. Ubah status pesanan menjadi &apos;Completed&apos; untuk memicu pesan ulasan ke WhatsApp pelanggan.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {testimonials.map((testi) => (
                <div key={testi.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">{testi.customerName || 'Customer'}</h4>
                      <p className="text-xs text-slate-500">{testi.customerPhone} • {new Date(testi.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div className="flex gap-1">
                      {renderStars(testi.rating)}
                    </div>
                  </div>
                  <p className="text-slate-700 italic">&quot;{testi.reviewText || 'Memberikan rating tanpa komentar.'}&quot;</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
