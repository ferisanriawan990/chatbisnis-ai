import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        priceMonthly: true,
        maxWhatsappSessions: true,
        maxKnowledgeItems: true,
        monthlyChatLimit: true,
        allowN8nTemplates: true,
        allowLeadCapture: true,
        allowHumanHandover: true,
        allowCustomApiKey: true,
      }
    });

    return NextResponse.json({ success: true, plans });
  } catch (error) {
    console.error('GET /api/plans Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
