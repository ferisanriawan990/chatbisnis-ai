'use client';

import { useState, useEffect } from 'react';

import { CreditCard, CheckCircle2 } from 'lucide-react';

export default function DashboardBillingPage() {
  const [plans, setPlans] = useState<any[]>([]) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [currentSub, setCurrentSub] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dashboard/billing');
      if (res.ok) {
        const data = await res.json();
        setCurrentSub(data.activeSubscription);
        setPlans(data.availablePlans || []);
      }
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // Ignore errors for now
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-indigo-600" />
          Langganan & Billing
        </h1>
        <p className="text-slate-500 mt-1">Kelola paket langganan dan metode pembayaran Anda.</p>
      </div>

      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <h2 className="text-lg font-medium opacity-90 mb-1">Paket Saat Ini</h2>
        <div className="text-3xl font-bold mb-4">{currentSub?.plan?.name || 'Paket Free (Trial)'}</div>
        <p className="opacity-80 text-sm max-w-xl">
          Paket Anda saat ini aktif sampai {currentSub?.expiredAt ? new Date(currentSub.expiredAt).toLocaleDateString() : 'selamanya'}. 
          Tingkatkan paket untuk mendapatkan limit pesan dan fitur kecerdasan buatan yang lebih banyak.
        </p>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Pilih Paket Upgrade</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? <p>Memuat paket...</p> : plans.filter(p => p.isActive).map(p => (
            <div key={p.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col hover:border-indigo-500 hover:shadow-md transition-all">
              <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
              <div className="text-3xl font-bold text-slate-900 my-4">
                Rp {p.priceMonthly.toLocaleString('id-ID')}
                <span className="text-sm font-normal text-slate-500">/bln</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1 text-slate-600 text-sm">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> {p.maxWhatsappSessions} Sesi WhatsApp</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> {p.maxKnowledgeItems} Item Pengetahuan</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> {p.dailyChatLimit} Chat / Hari</li>
                {p.allowN8nTemplates && <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Custom n8n Webhook</li>}
                {p.allowLeadCapture && <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Auto Lead Capture</li>}
              </ul>
              <button disabled className="w-full py-3 rounded-xl font-medium border border-slate-300 text-slate-500 bg-slate-50 transition-colors">
                Pembayaran Segera Tersedia
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
