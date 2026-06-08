import { NextResponse } from 'next/server';
import { getRequiredAdminOrResponse } from '@/lib/admin-helper';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const admin = await getRequiredAdminOrResponse();
    if (admin instanceof NextResponse) return admin;

    const today = new Date();
    const monthStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        subscriptions: {
          include: { plan: true },
          where: { status: 'active' }
        },
        chatbotSettings: {
          select: { isActive: true, botName: true }
        },
        whatsappSessions: {
          select: { status: true, sessionName: true }
        },
        _count: {
          select: {
            knowledgeItems: true,
            leads: true
          }
        },
        usageCounters: {
          select: { aiChats: true },
          where: { month: monthStr }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const mappedUsers = users.map(u => {
      const chatsThisMonth = u.usageCounters.reduce((acc, curr) => acc + curr.aiChats, 0);
      return {
        ...u,
        chatsThisMonth
      };
    });

    return NextResponse.json(mappedUsers);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
