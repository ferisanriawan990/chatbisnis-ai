import { NextResponse } from 'next/server';
import { getRequiredAdminOrResponse } from '@/lib/admin-helper';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const admin = await getRequiredAdminOrResponse();
    if (admin instanceof NextResponse) return admin;

    const [
      totalUsers,
      totalLeads,
      activeWahaSessions,
      failedWahaSessions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.lead.count(),
      prisma.whatsAppSession.count({ where: { status: 'connected' } }),
      prisma.whatsAppSession.count({ where: { status: 'failed' } }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [chatsToday, chatsThisMonth] = await Promise.all([
      prisma.chatLog.count({ where: { createdAt: { gte: today } } }),
      prisma.chatLog.count({ where: { createdAt: { gte: startOfMonth } } }),
    ]);

    const aiUsage = await prisma.usageCounter.aggregate({
      _sum: { aiTokens: true },
      where: { month: `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}` }
    });

    return NextResponse.json({
      totalUsers,
      activeUsers: totalUsers, // Simplify for now
      totalChatsToday: chatsToday,
      totalChatsThisMonth: chatsThisMonth,
      totalLeads,
      activeWahaSessions,
      failedWahaSessions,
      totalAiUsage: aiUsage._sum.aiTokens || 0,
    });
  } catch (error) {
    console.error('GET /api/admin/overview Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
