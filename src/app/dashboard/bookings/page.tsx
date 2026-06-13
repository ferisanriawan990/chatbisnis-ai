'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Calendar, CheckCircle2, Clock, XCircle, Search, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function BookingsPage() {
  const { data: session, status } = useSession();
  const tenants = (session?.user as any)?.tenants || [];
  const activeTenantId = tenants[0]?.id;

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTenantId) fetchBookings();
  }, [activeTenantId]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/dashboard/bookings?tenantId=${activeTenantId}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (bookingId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/dashboard/bookings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bookingId, status: newStatus }),
      });
      if (res.ok) fetchBookings();
    } catch (e) {
      console.error(e);
    }
  };

  if (status === 'loading') return <div className="p-10 text-center animate-pulse text-slate-500 font-medium">Memuat data...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32 pt-8 px-4 sm:px-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-lg p-8 rounded-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20">
              <CalendarDays className="w-8 h-8 text-white" />
            </div>
            Jadwal Reservasi
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-lg ml-14">Kelola jadwal yang dibuat otomatis oleh AI.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative z-10">
        {loading ? (
          <div className="p-10 text-center text-slate-500 font-medium animate-pulse">Memuat Jadwal...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-[11px] font-extrabold text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="px-6 py-5">Tanggal & Jam</th>
                  <th className="px-6 py-5">Pelanggan</th>
                  <th className="px-6 py-5">Layanan</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-slate-400 font-medium">
                      Belum ada jadwal reservasi.
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5 font-bold text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-500" />
                          {format(new Date(booking.bookingDate), "dd MMM yyyy, HH:mm", { locale: id })}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-bold text-slate-800">{booking.customerName || 'Pelanggan AI'}</p>
                        <p className="text-xs text-slate-500">{booking.customerPhone}</p>
                      </td>
                      <td className="px-6 py-5">
                        <span className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-indigo-100">
                          {booking.serviceName}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        {booking.status === 'pending' && <span className="text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border border-amber-200 flex items-center gap-1 w-max"><Clock className="w-3 h-3" /> Pending</span>}
                        {booking.status === 'confirmed' && <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border border-emerald-200 flex items-center gap-1 w-max"><CheckCircle2 className="w-3 h-3" /> Disetujui</span>}
                        {booking.status === 'cancelled' && <span className="text-red-600 bg-red-50 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border border-red-200 flex items-center gap-1 w-max"><XCircle className="w-3 h-3" /> Dibatalkan</span>}
                        {booking.status === 'completed' && <span className="text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border border-blue-200 flex items-center gap-1 w-max"><CheckCircle2 className="w-3 h-3" /> Selesai</span>}
                      </td>
                      <td className="px-6 py-5 text-right whitespace-nowrap">
                        {booking.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => updateStatus(booking.id, 'confirmed')} className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Setujui</button>
                            <button onClick={() => updateStatus(booking.id, 'cancelled')} className="text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Tolak</button>
                          </div>
                        )}
                        {booking.status === 'confirmed' && (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => updateStatus(booking.id, 'completed')} className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Selesaikan</button>
                            <button onClick={() => updateStatus(booking.id, 'cancelled')} className="text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Batal</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
