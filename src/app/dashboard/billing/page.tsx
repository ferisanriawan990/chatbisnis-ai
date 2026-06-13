/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { CreditCard, CheckCircle2, MessageCircle, Database, Wifi, Sparkles, ShieldCheck } from 'lucide-react';

interface PlanRow {
  id: string;
  name: string;
  priceMonthly: number;
  isActive: boolean;
  maxWhatsappSessions: number;
  maxKnowledgeItems: number;
  dailyChatLimit: number;
  allowLeadCapture: boolean;
}

interface SubscriptionRow {
  status: string;
  expiredAt?: string;
  plan?: PlanRow;
}

interface BillingData {
  activeSubscription?: SubscriptionRow;
  activePlan?: PlanRow;
  usageToday?: number;
  usageThisMonth?: number;
  tokensThisMonth?: number;
  whatsappMessagesThisMonth?: number;
  knowledgeUsed?: number;
  whatsappSessionsUsed?: number;
  availablePlans?: PlanRow[];
}

export default function DashboardBillingPage() {
  const [data, setData] = useState<BillingData>({});
  const [loading, setLoading] = useState(true);
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/billing');
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubscribe = async (planId: string) => {
    try {
      setLoadingCheckout(planId);
      const res = await fetch('/api/dashboard/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      });
      const result = await res.json();
      if (result.redirect_url) {
        window.location.href = result.redirect_url;
      } else {
        alert(result.error || 'Gagal memulai pembayaran.');
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setLoadingCheckout(null);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void fetchData(); }, []);

  const plan = data.activePlan;
  const sub = data.activeSubscription;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 font-sans">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-indigo-600" />
          Langganan & Billing
        </h1>
        <p className="text-slate-500 text-lg">Kelola status layanan, metrik limitasi, dan tingkatkan potensi akun Anda.</p>
      </div>

      {/* Current Plan Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 md:p-10 text-white shadow-2xl shadow-indigo-500/20 bg-slate-900">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-600 to-purple-800 opacity-90 z-0"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-indigo-200 font-semibold uppercase tracking-wider text-sm mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> PAKET ANDA SAAT INI
            </h2>
            <div className="text-4xl md:text-5xl font-black mb-3">{plan?.name || sub?.plan?.name || 'Paket Free (Trial)'}</div>
            
            {sub?.expiredAt ? (
              <p className="text-indigo-100 font-medium bg-white/10 px-4 py-2 rounded-full inline-block backdrop-blur-sm border border-white/10">
                Aktif sampai: {new Date(sub.expiredAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            ) : (
              <p className="text-red-200 bg-red-500/20 px-4 py-2 rounded-full inline-block backdrop-blur-sm border border-red-500/30 text-sm">
                Tidak ada langganan berbayar aktif.
              </p>
            )}
          </div>
          <div className="hidden md:block">
            <Sparkles className="w-32 h-32 text-white/20 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Usage Stats Grid */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.1)] border border-slate-100/60 hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-50 w-10 h-10 rounded-xl flex items-center justify-center text-blue-500"><MessageCircle className="w-5 h-5" /></div>
              <p className="font-semibold text-slate-600">Chat Hari Ini</p>
            </div>
            <p className="text-4xl font-black text-slate-800 tracking-tight">{data.usageToday ?? 0}</p>
            {plan?.dailyChatLimit && (
              <p className="text-xs font-medium text-slate-400 mt-2 bg-slate-50 inline-block px-2 py-1 rounded-md">Limit: {plan.dailyChatLimit}/hari</p>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.1)] border border-slate-100/60 hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-indigo-50 w-10 h-10 rounded-xl flex items-center justify-center text-indigo-500"><MessageCircle className="w-5 h-5" /></div>
              <p className="font-semibold text-slate-600">Chat Bulanan</p>
            </div>
            <p className="text-4xl font-black text-slate-800 tracking-tight">{data.usageThisMonth ?? 0}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.1)] border border-slate-100/60 hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-50 w-10 h-10 rounded-xl flex items-center justify-center text-emerald-500"><Database className="w-5 h-5" /></div>
              <p className="font-semibold text-slate-600">Pengetahuan</p>
            </div>
            <p className="text-4xl font-black text-slate-800 tracking-tight">{data.knowledgeUsed ?? 0}</p>
            {plan?.maxKnowledgeItems && (
              <p className="text-xs font-medium text-slate-400 mt-2 bg-slate-50 inline-block px-2 py-1 rounded-md">Limit: {plan.maxKnowledgeItems}</p>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.1)] border border-slate-100/60 hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-amber-50 w-10 h-10 rounded-xl flex items-center justify-center text-amber-500"><Wifi className="w-5 h-5" /></div>
              <p className="font-semibold text-slate-600">Sesi WhatsApp</p>
            </div>
            <p className="text-4xl font-black text-slate-800 tracking-tight">{data.whatsappSessionsUsed ?? 0}</p>
            {plan?.maxWhatsappSessions && (
              <p className="text-xs font-medium text-slate-400 mt-2 bg-slate-50 inline-block px-2 py-1 rounded-md">Limit: {plan.maxWhatsappSessions}</p>
            )}
          </div>
        </div>
      )}

      {/* Upgrade Section */}
      <div className="mt-12 pt-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Upgrade ke Enterprise</h2>
          <p className="text-slate-500 mt-1">Pembayaran aman, diproses instan melalui Midtrans 24/7.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {loading ? (
            <p className="text-slate-500 animate-pulse col-span-3">Mengambil data paket...</p>
          ) : (
            (data.availablePlans || []).filter((p) => p.isActive).map((p) => {
              const isCurrent = plan?.id === p.id;
              return (
                <div
                  key={p.id}
                  className={`relative bg-white rounded-3xl p-8 border-2 flex flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.2)]
                    ${isCurrent ? 'border-emerald-500 shadow-xl' : 'border-slate-100'}
                  `}
                >
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">PAKET AKTIF</div>
                  )}
                  <h3 className="text-xl font-bold text-slate-800">{p.name}</h3>
                  <div className="mt-4 mb-6">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">Rp {p.priceMonthly.toLocaleString('id-ID')}</span>
                    <span className="text-slate-500 font-medium">/bln</span>
                  </div>
                  
                  <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-center gap-3 text-sm text-slate-700">
                      <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> <span className="font-semibold text-slate-900">{p.maxWhatsappSessions}</span> Sesi WhatsApp
                    </li>
                    <li className="flex items-center gap-3 text-sm text-slate-700">
                      <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> <span className="font-semibold text-slate-900">{p.maxKnowledgeItems}</span> Item Pengetahuan
                    </li>
                    <li className="flex items-center gap-3 text-sm text-slate-700">
                      <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> <span className="font-semibold text-slate-900">{p.dailyChatLimit}</span> Chat Harian
                    </li>
                    {p.allowLeadCapture && (
                      <li className="flex items-center gap-3 text-sm text-slate-700">
                        <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> Ekstraksi Lead Otomatis
                      </li>
                    )}
                  </ul>
                  
                  <button
                    disabled={loadingCheckout === p.id || isCurrent}
                    onClick={() => handleSubscribe(p.id)}
                    className={`w-full py-3.5 rounded-2xl font-bold text-center transition-all ${
                      isCurrent ? 'bg-slate-100 text-slate-400 cursor-not-allowed' :
                      loadingCheckout === p.id 
                        ? 'bg-slate-100 text-slate-400 cursor-wait'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30'
                    }`}
                  >
                    {isCurrent ? 'Ini Paket Anda' : loadingCheckout === p.id ? 'Memproses...' : 'Upgrade Sekarang'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
