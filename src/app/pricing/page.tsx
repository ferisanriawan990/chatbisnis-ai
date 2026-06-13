import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { priceMonthly: 'asc' }
  });

  return (
    <div className="min-h-screen bg-slate-50 py-24 px-4">
      <div className="max-w-5xl mx-auto text-center space-y-12">
        <h1 className="text-4xl font-bold text-slate-900">Pilih Paket Sesuai Kebutuhan Bisnis Anda</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">Kami menyediakan berbagai pilihan paket berlangganan dengan fitur yang dapat diskalakan sesuai dengan pertumbuhan UMKM Anda.</p>
        
        <div className="grid md:grid-cols-3 gap-8 text-left mt-12">
          {plans.map((plan) => {
            const isPopular = plan.slug === 'pro';
            return (
              <div key={plan.id} className={`p-8 rounded-2xl border shadow-sm ${isPopular ? 'bg-blue-600 border-blue-600 text-white shadow-xl transform md:-translate-y-4' : 'bg-white border-slate-200'}`}>
                {isPopular && <div className="bg-white text-blue-600 text-xs font-bold px-3 py-1 rounded-full w-max mb-4">PALING POPULER</div>}
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className={`text-3xl font-black mt-4`}>
                  Rp {plan.priceMonthly.toLocaleString('id-ID')}
                  <span className={`text-sm font-normal ${isPopular ? 'text-blue-200' : 'text-slate-500'}`}>/bulan</span>
                </p>
                <ul className={`mt-6 space-y-3 text-sm ${isPopular ? 'text-blue-50' : 'text-slate-600'}`}>
                  <li>✅ {plan.monthlyChatLimit.toLocaleString('id-ID')} Chat / Bulan</li>
                  <li>✅ {plan.maxKnowledgeItems} Item Knowledge Base</li>
                  <li>✅ {plan.maxWhatsappSessions} Sesi WhatsApp</li>
                  {plan.allowLeadCapture ? <li>✅ Auto Lead Capture</li> : <li>❌ Tidak ada Auto Lead Capture</li>}
                  {plan.allowHumanHandover && <li>✅ Human Handover</li>}
                </ul>
                <Link href="/register" className={`mt-8 block w-full py-3 text-center rounded-xl font-bold shadow-md transition-colors ${isPopular ? 'bg-white text-blue-600 hover:bg-slate-100' : 'border border-blue-600 text-blue-600 hover:bg-blue-50'}`}>
                  {plan.priceMonthly === 0 ? 'Coba Gratis' : 'Berlangganan'}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
