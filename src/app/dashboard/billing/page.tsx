/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { CreditCard, CheckCircle2, MessageCircle, Database, Wifi } from 'lucide-react';

interface PlanRow {
  id: string;
  name: string;
  priceMonthly: number;
  isActive: boolean;
  maxWhatsappSessions: number;
  maxKnowledgeItems: number;
  dailyChatLimit: number;
  allowN8nTemplates: boolean;
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void fetchData(); }, []);

  const plan = data.activePlan;
  const sub = data.activeSubscription;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-indigo-600" />
          Langganan &amp; Billing
        </h1>
        <p className="text-slate-500 mt-1">Kelola paket langganan dan pantau penggunaan Anda.</p>
      </div>

      {/* Current Plan Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <h2 className="text-lg font-medium opacity-90 mb-1">Paket Saat Ini</h2>
        <div className="text-3xl font-bold mb-2">{plan?.name || sub?.plan?.name || 'Paket Free (Trial)'}</div>
        {sub?.expiredAt && (
          <p className="opacity-80 text-sm">
            Aktif sampai {new Date(sub.expiredAt).toLocaleDateString('id-ID')}
          </p>
        )}
        {!sub && (
          <p className="opacity-80 text-sm mt-2">
            Anda belum berlangganan paket berbayar. Hubungi admin untuk upgrade.
          </p>
        )}
      </div>

      {/* Usage Stats */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <MessageCircle className="w-5 h-5 text-blue-500" />
              <p className="text-sm text-slate-500">Chat Hari Ini</p>
            </div>
            <p className="text-2xl font-bold text-slate-800">{data.usageToday ?? 0}</p>
            {plan?.dailyChatLimit && (
              <p className="text-xs text-slate-400 mt-1">Limit: {plan.dailyChatLimit}/hari</p>
            )}
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <MessageCircle className="w-5 h-5 text-indigo-500" />
              <p className="text-sm text-slate-500">Chat Bulan Ini</p>
            </div>
            <p className="text-2xl font-bold text-slate-800">{data.usageThisMonth ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Database className="w-5 h-5 text-emerald-500" />
              <p className="text-sm text-slate-500">Knowledge Base</p>
            </div>
            <p className="text-2xl font-bold text-slate-800">{data.knowledgeUsed ?? 0}</p>
            {plan?.maxKnowledgeItems && (
              <p className="text-xs text-slate-400 mt-1">Limit: {plan.maxKnowledgeItems}</p>
            )}
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Wifi className="w-5 h-5 text-purple-500" />
              <p className="text-sm text-slate-500">Sesi WhatsApp</p>
            </div>
            <p className="text-2xl font-bold text-slate-800">{data.whatsappSessionsUsed ?? 0}</p>
            {plan?.maxWhatsappSessions && (
              <p className="text-xs text-slate-400 mt-1">Limit: {plan.maxWhatsappSessions}</p>
            )}
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div className="mt-4">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Pilih Paket Upgrade</h2>
        {/* TODO: Integrate payment gateway (Midtrans/etc.) for automated billing */}
        <p className="text-sm text-slate-500 mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          💡 Pembayaran manual — silakan hubungi admin untuk melakukan upgrade paket.
          Integrasi payment gateway akan tersedia di versi mendatang.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            <p className="text-slate-500">Memuat paket...</p>
          ) : (
            (data.availablePlans || []).filter((p) => p.isActive).map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col hover:border-indigo-500 hover:shadow-md transition-all"
              >
                <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
                <div className="text-3xl font-bold text-slate-900 my-4">
                  Rp {p.priceMonthly.toLocaleString('id-ID')}
                  <span className="text-sm font-normal text-slate-500">/bln</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1 text-slate-600 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {p.maxWhatsappSessions} Sesi WhatsApp
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {p.maxKnowledgeItems} Item Pengetahuan
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {p.dailyChatLimit} Chat / Hari
                  </li>
                  {p.allowN8nTemplates && (
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Custom n8n Webhook
                    </li>
                  )}
                  {p.allowLeadCapture && (
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Auto Lead Capture
                    </li>
                  )}
                </ul>
                <a
                  href="https://wa.me/+6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl font-medium border border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors text-center text-sm"
                >
                  Hubungi Admin untuk Upgrade
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
