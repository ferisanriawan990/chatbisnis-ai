import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    const chatbotSetting = await prisma.chatbotSetting.findFirst({
      where: { userId },
    });

    if (!chatbotSetting) {
      return NextResponse.json({
        todayChats: 0,
        monthlyChats: 0,
        newLeads: 0,
        needsHuman: 0,
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [todayChats, monthlyChats, newLeads, needsHuman] = await Promise.all([
      prisma.chatLog.count({
        where: { chatbotSettingId: chatbotSetting.id, createdAt: { gte: today } },
      }),
      prisma.chatLog.count({
        where: { chatbotSettingId: chatbotSetting.id, createdAt: { gte: firstDayOfMonth } },
      }),
      prisma.lead.count({
        where: { businessProfileId: chatbotSetting.businessProfileId, createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.chatLog.count({
        where: { chatbotSettingId: chatbotSetting.id, needsHuman: true, status: 'success' },
      }),
    ]);

    return NextResponse.json({
      todayChats,
      monthlyChats,
      newLeads,
      needsHuman,
    });
  } catch (error) {
    console.error('GET /api/dashboard/analytics Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
