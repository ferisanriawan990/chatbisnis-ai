import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { CheckCircle2, XCircle, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { priceMonthly: 'asc' }
  });

  return (
    <div className="min-h-screen bg-slate-50 py-24 px-4 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-6xl mx-auto text-center space-y-8 relative z-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Pilih Paket Pertumbuhan Anda
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mt-6">
            Solusi AI WhatsApp tingkat Enterprise dengan harga transparan. Skalakan bisnis tanpa hambatan teknis.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 text-left mt-16 pt-8">
          {plans.map((plan) => {
            const isPopular = plan.slug === 'pro' || plan.slug === 'premium';
            
            return (
              <div 
                key={plan.id} 
                className={`relative p-8 rounded-3xl border transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 flex flex-col
                  ${isPopular 
                    ? 'bg-gradient-to-b from-indigo-900 to-slate-900 border-indigo-700 text-white shadow-xl shadow-indigo-900/20 md:-translate-y-4' 
                    : 'bg-white border-slate-200 shadow-sm'
                  }
                `}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1 shadow-lg shadow-indigo-500/30 border border-white/20">
                    <Sparkles className="w-3 h-3" /> PALING POPULER
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={`text-xl font-bold ${isPopular ? 'text-indigo-300' : 'text-slate-800'}`}>{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-black tracking-tight">
                      Rp {plan.priceMonthly.toLocaleString('id-ID')}
                    </span>
                    <span className={`text-sm font-medium ${isPopular ? 'text-slate-400' : 'text-slate-500'}`}>/bln</span>
                  </div>
                </div>

                <div className="flex-1">
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className={`w-5 h-5 shrink-0 ${isPopular ? 'text-indigo-400' : 'text-indigo-600'}`} />
                      <span className={`text-sm ${isPopular ? 'text-slate-300' : 'text-slate-700'}`}>
                        <strong className={isPopular ? 'text-white' : 'text-slate-900'}>{plan.monthlyChatLimit.toLocaleString('id-ID')}</strong> Chat AI / Bulan
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className={`w-5 h-5 shrink-0 ${isPopular ? 'text-indigo-400' : 'text-indigo-600'}`} />
                      <span className={`text-sm ${isPopular ? 'text-slate-300' : 'text-slate-700'}`}>
                        <strong className={isPopular ? 'text-white' : 'text-slate-900'}>{plan.maxKnowledgeItems}</strong> Item Knowledge Base
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className={`w-5 h-5 shrink-0 ${isPopular ? 'text-indigo-400' : 'text-indigo-600'}`} />
                      <span className={`text-sm ${isPopular ? 'text-slate-300' : 'text-slate-700'}`}>
                        <strong className={isPopular ? 'text-white' : 'text-slate-900'}>{plan.maxWhatsappSessions}</strong> Nomor WhatsApp
                      </span>
                    </li>

                    <li className="flex items-start gap-3">
                      {plan.allowLeadCapture ? (
                        <>
                          <CheckCircle2 className={`w-5 h-5 shrink-0 ${isPopular ? 'text-indigo-400' : 'text-indigo-600'}`} />
                          <span className={`text-sm ${isPopular ? 'text-slate-300' : 'text-slate-700'}`}>Auto Lead Capture</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 shrink-0 text-slate-300 dark:text-slate-600" />
                          <span className="text-sm text-slate-400">Tanpa Lead Capture</span>
                        </>
                      )}
                    </li>

                    <li className="flex items-start gap-3">
                      {plan.allowHumanHandover ? (
                        <>
                          <CheckCircle2 className={`w-5 h-5 shrink-0 ${isPopular ? 'text-indigo-400' : 'text-indigo-600'}`} />
                          <span className={`text-sm ${isPopular ? 'text-slate-300' : 'text-slate-700'}`}>Live Human Handover</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 shrink-0 text-slate-300 dark:text-slate-600" />
                          <span className="text-sm text-slate-400">Tanpa Human Handover</span>
                        </>
                      )}
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-200/20">
                  <Link 
                    href="/register" 
                    className={`block w-full py-3.5 text-center rounded-2xl font-bold transition-all
                      ${isPopular 
                        ? 'bg-white text-indigo-900 hover:bg-indigo-50 shadow-lg shadow-white/10' 
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                      }`}
                  >
                    {plan.priceMonthly === 0 ? 'Mulai Gratis Sekarang' : 'Pilih Paket Ini'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
