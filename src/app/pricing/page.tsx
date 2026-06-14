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
    <div className="min-h-screen bg-slate-50 py-24 px-4 font-sans relative overflow-hidden animate-in fade-in duration-700">
      {/* Premium Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[600px] bg-gradient-to-b from-indigo-500/20 via-purple-500/10 to-transparent blur-[120px] rounded-full pointer-events-none -z-10"></div>
      <div className="absolute top-40 -left-40 w-96 h-96 bg-blue-400/20 blur-[100px] rounded-full pointer-events-none -z-10"></div>
      <div className="absolute top-80 -right-40 w-96 h-96 bg-fuchsia-400/20 blur-[100px] rounded-full pointer-events-none -z-10"></div>

      <div className="max-w-6xl mx-auto text-center space-y-8 relative z-10">
        <div className="space-y-6">
          <div className="inline-flex items-center justify-center gap-2 bg-white/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/80 shadow-sm text-sm font-bold text-indigo-700 uppercase tracking-wider mx-auto">
            <Sparkles className="w-4 h-4 text-indigo-500" /> Pricing Plans
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent tracking-tight">
            Pilih Paket Pertumbuhan Anda
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium">
            Solusi AI WhatsApp tingkat Enterprise dengan harga transparan. Skalakan bisnis tanpa hambatan teknis.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 text-left mt-16 pt-8">
          {plans.map((plan) => {
            const isPopular = plan.slug === 'pro' || plan.slug === 'premium';
            
            return (
              <div 
                key={plan.id} 
                className={`relative p-8 md:p-10 rounded-[2.5rem] border transition-all duration-500 hover:-translate-y-4 flex flex-col group overflow-hidden
                  ${isPopular 
                    ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-indigo-500/30 text-white shadow-[0_20px_60px_-15px_rgba(79,70,229,0.5)] md:-translate-y-4' 
                    : 'bg-white/80 backdrop-blur-xl border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-2xl'
                  }
                `}
              >
                {!isPopular && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-100/50 to-transparent rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110"></div>
                )}
                {isPopular && (
                  <>
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-[0.03] pointer-events-none"></div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-b-2xl shadow-lg flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5" /> PALING POPULER
                    </div>
                  </>
                )}

                <div className={`mb-8 relative z-10 ${isPopular ? 'mt-4' : ''}`}>
                  <h3 className={`text-2xl font-extrabold ${isPopular ? 'bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent' : 'text-slate-800'}`}>{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-5xl font-black tracking-tight">
                      Rp {plan.priceMonthly.toLocaleString('id-ID')}
                    </span>
                    <span className={`text-sm font-bold uppercase tracking-wider ${isPopular ? 'text-indigo-300/70' : 'text-slate-400'}`}>/bln</span>
                  </div>
                </div>

                <div className="flex-1 relative z-10">
                  <ul className="space-y-5">
                    <li className="flex items-start gap-4">
                      <div className={`p-1 rounded-full ${isPopular ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      </div>
                      <span className={`text-sm font-medium ${isPopular ? 'text-indigo-100/80' : 'text-slate-600'}`}>
                        <strong className={`font-extrabold text-base ${isPopular ? 'text-white' : 'text-slate-900'}`}>{plan.monthlyChatLimit.toLocaleString('id-ID')}</strong> Chat AI / Bulan
                      </span>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className={`p-1 rounded-full ${isPopular ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      </div>
                      <span className={`text-sm font-medium ${isPopular ? 'text-indigo-100/80' : 'text-slate-600'}`}>
                        <strong className={`font-extrabold text-base ${isPopular ? 'text-white' : 'text-slate-900'}`}>{plan.maxKnowledgeItems}</strong> Item Knowledge Base
                      </span>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className={`p-1 rounded-full ${isPopular ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      </div>
                      <span className={`text-sm font-medium ${isPopular ? 'text-indigo-100/80' : 'text-slate-600'}`}>
                        <strong className={`font-extrabold text-base ${isPopular ? 'text-white' : 'text-slate-900'}`}>{plan.maxWhatsappSessions}</strong> Nomor WhatsApp
                      </span>
                    </li>

                    <li className="flex items-start gap-4">
                      {plan.allowLeadCapture ? (
                        <>
                          <div className={`p-1 rounded-full ${isPopular ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                          </div>
                          <span className={`text-sm font-medium ${isPopular ? 'text-indigo-100/80' : 'text-slate-600'}`}>Auto Lead Capture</span>
                        </>
                      ) : (
                        <>
                          <div className={`p-1 rounded-full ${isPopular ? 'bg-slate-700 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                            <XCircle className="w-4 h-4 shrink-0" />
                          </div>
                          <span className={`text-sm font-medium ${isPopular ? 'text-slate-500' : 'text-slate-400'}`}>Tanpa Lead Capture</span>
                        </>
                      )}
                    </li>

                    <li className="flex items-start gap-4">
                      {plan.allowHumanHandover ? (
                        <>
                          <div className={`p-1 rounded-full ${isPopular ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                          </div>
                          <span className={`text-sm font-medium ${isPopular ? 'text-indigo-100/80' : 'text-slate-600'}`}>Live Human Handover</span>
                        </>
                      ) : (
                        <>
                          <div className={`p-1 rounded-full ${isPopular ? 'bg-slate-700 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                            <XCircle className="w-4 h-4 shrink-0" />
                          </div>
                          <span className={`text-sm font-medium ${isPopular ? 'text-slate-500' : 'text-slate-400'}`}>Tanpa Human Handover</span>
                        </>
                      )}
                    </li>
                  </ul>
                </div>

                <div className={`mt-10 pt-8 relative z-10 ${isPopular ? 'border-t border-indigo-500/20' : 'border-t border-slate-100/50'}`}>
                  <Link 
                    href="/register" 
                    className={`block w-full py-4 text-center rounded-2xl font-bold transition-all
                      ${isPopular 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-400 hover:to-purple-400 shadow-lg shadow-indigo-500/25 hover:scale-[1.02]' 
                        : 'bg-white border border-slate-200/60 shadow-sm text-slate-800 hover:bg-slate-50 hover:border-slate-300 hover:scale-[1.02]'
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
