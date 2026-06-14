import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    // Get active subscription
    const activeSubscription = await prisma.subscription.findFirst({
      where: { userId, status: 'active', OR: [{ expiredAt: null }, { expiredAt: { gt: new Date() } }] },
      include: { plan: true },
      orderBy: { createdAt: 'desc' }
    });

    // Get usage today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const usageToday = await prisma.usageCounter.findUnique({
      where: { userId_date: { userId, date: today } }
    });

    // Get usage this month
    const monthStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
    const monthlyUsageData = await prisma.usageCounter.aggregate({
      _sum: { aiChats: true, whatsappMessages: true, aiTokens: true },
      where: { userId, month: monthStr }
    });

    // Get knowledge used
    const knowledgeUsed = await prisma.knowledgeItem.count({
      where: { userId }
    });

    // Get whatsapp sessions used
    const whatsappSessionsUsed = await prisma.whatsAppSession.count({
      where: { userId }
    });

    // Get available plans (for user to upgrade)
    const availablePlans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: 'asc' }
    });

    return NextResponse.json({
      activeSubscription,
      activePlan: activeSubscription?.plan,
      usageToday: usageToday?.aiChats || 0,
      usageThisMonth: monthlyUsageData._sum.aiChats || 0,
      tokensThisMonth: monthlyUsageData._sum.aiTokens || 0,
      whatsappMessagesThisMonth: monthlyUsageData._sum.whatsappMessages || 0,
      knowledgeUsed,
      whatsappSessionsUsed,
      availablePlans
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown';
    console.error('Error fetching billing info:', msg);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
