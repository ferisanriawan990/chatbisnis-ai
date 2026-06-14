import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getActiveTenant } from '@/lib/tenant-isolation';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const tenant = await getActiveTenant(req, session.user);
    if (!tenant) return NextResponse.json({
        summary: { totalChats: 0, aiAnswered: 0, handoverCount: 0, revenue: 0, conversionRate: 0 },
        chartData: []
    });

    // Fetch the active chatbot setting
    const chatbotSetting = await prisma.chatbotSetting.findFirst({
      where: { businessProfileId: tenant.id },
      select: { id: true, businessProfileId: true }
    });

    if (!chatbotSetting) {
      return NextResponse.json({
        summary: { totalChats: 0, aiAnswered: 0, handoverCount: 0, revenue: 0, conversionRate: 0 },
        chartData: []
      });
    }

    const sevenDaysAgo = startOfDay(subDays(new Date(), 6));

    // 1. CHAT LOGS
    const chatLogs = await prisma.chatLog.findMany({
      where: {
        chatbotSettingId: chatbotSetting.id,
        createdAt: { gte: sevenDaysAgo }
      },
      select: { createdAt: true, needsHuman: true }
    });

    let totalChats = 0;
    let handoverCount = 0;
    let aiAnswered = 0;

    // Grouping by date for chart
    const chartMap = new Map<string, { date: string; chats: number; aiAnswered: number; handover: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = startOfDay(subDays(new Date(), i));
      chartMap.set(format(d, 'yyyy-MM-dd'), { date: format(d, 'dd MMM'), chats: 0, aiAnswered: 0, handover: 0 });
    }

    for (const log of chatLogs) {
      totalChats++;
      const isHandover = log.needsHuman;
      if (isHandover) handoverCount++;
      else aiAnswered++;

      const dateStr = format(startOfDay(log.createdAt), 'yyyy-MM-dd');
      if (chartMap.has(dateStr)) {
        const entry = chartMap.get(dateStr)!;
        entry.chats++;
        if (isHandover) entry.handover++;
        else entry.aiAnswered++;
      }
    }

    // 2. REVENUE
    const orders = await prisma.order.findMany({
      where: {
        businessProfileId: chatbotSetting.businessProfileId,
        createdAt: { gte: sevenDaysAgo },
        status: { in: ['completed', 'paid'] }
      },
      select: { totalAmount: true }
    });

    const revenue = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

    // 3. CONVERSION RATE
    const leadsCount = await prisma.lead.count({
      where: { businessProfileId: chatbotSetting.businessProfileId }
    });
    const convertedLeads = await prisma.lead.count({
      where: { businessProfileId: chatbotSetting.businessProfileId, status: 'converted' }
    });

    let conversionRate = 0;
    if (leadsCount > 0) {
      conversionRate = Math.round((convertedLeads / leadsCount) * 100);
    }

    // 4. SENTIMENT ANALYSIS
    const conversations = await prisma.conversationState.findMany({
      where: {
        businessProfileId: chatbotSetting.businessProfileId,
        lastMessageAt: { gte: sevenDaysAgo }
      },
      select: { sentimentScore: true }
    });

    const sentimentCount = { positif: 0, netral: 0, negatif: 0, marah: 0 };
    for (const c of conversations) {
      if (c.sentimentScore === 'positif') sentimentCount.positif++;
      else if (c.sentimentScore === 'negatif') sentimentCount.negatif++;
      else if (c.sentimentScore === 'marah') sentimentCount.marah++;
      else sentimentCount.netral++;
    }

    const sentimentData = [
      { name: 'Positif', value: sentimentCount.positif, color: '#10b981' }, // emerald-500
      { name: 'Netral', value: sentimentCount.netral, color: '#94a3b8' },  // slate-400
      { name: 'Negatif', value: sentimentCount.negatif, color: '#f59e0b' }, // amber-500
      { name: 'Marah', value: sentimentCount.marah, color: '#ef4444' }    // red-500
    ].filter(item => item.value > 0);

    // 5. TOP PRODUCTS
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          businessProfileId: chatbotSetting.businessProfileId,
          createdAt: { gte: sevenDaysAgo },
          status: { in: ['completed', 'paid'] }
        }
      },
      include: {
        product: { select: { name: true, price: true } }
      }
    });

    const productMap = new Map<string, { id: string; name: string; quantity: number; revenue: number }>();
    for (const item of orderItems) {
      if (!item.productId || !item.product) continue;
      const existing = productMap.get(item.productId) || { id: item.productId, name: item.product.name, quantity: 0, revenue: 0 };
      existing.quantity += item.quantity;
      existing.revenue += (item.quantity * Number(item.price));
      productMap.set(item.productId, existing);
    }

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return NextResponse.json({
      summary: {
        totalChats,
        aiAnswered,
        handoverCount,
        revenue,
        conversionRate,
      },
      chartData: Array.from(chartMap.values()),
      sentimentData,
      topProducts
    });

  } catch (error) {
    console.error('GET /api/dashboard/analytics Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
