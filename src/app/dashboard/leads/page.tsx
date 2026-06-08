'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Users, Search } from 'lucide-react';

export default function DashboardLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/dashboard/leads');
      if (!res.ok) throw new Error('Failed to fetch leads');
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLeads();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-emerald-600" />
          Prospek Pelanggan (Leads)
        </h1>
        <p className="text-slate-500 mt-1">Daftar pelanggan yang menunjukkan ketertarikan (interest) melalui percakapan chatbot.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        {loading ? <p>Memuat data...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 font-medium">Nama/Kontak</th>
                  <th className="pb-3 font-medium">Ketertarikan</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-slate-500">Belum ada prospek pelanggan yang terdeteksi</td></tr>
                ) : (
                  leads.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="py-4">
                        <div className="font-medium text-slate-900">{l.customerName || 'Tanpa Nama'}</div>
                        <div className="text-slate-500 text-xs">{l.customerPhone}</div>
                      </td>
                      <td className="py-4 text-slate-700">{l.interest}</td>
                      <td className="py-4">
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs uppercase font-semibold">{l.status}</span>
                      </td>
                      <td className="py-4 text-slate-500">{new Date(l.createdAt).toLocaleDateString('id-ID')}</td>
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
