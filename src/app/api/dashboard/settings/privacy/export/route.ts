import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertTenantAccess } from '@/lib/tenant-isolation';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const chatbot = await prisma.chatbotSetting.findFirst({ where: { userId } });
    
    if (!chatbot) {
      return NextResponse.json({ error: 'Belum ada chatbot terdaftar' }, { status: 400 });
    }

    // Must be admin of this business
    const hasAccess = await assertTenantAccess(userId, chatbot.businessProfileId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all leads
    const leads = await prisma.lead.findMany({
      where: { businessProfileId: chatbot.businessProfileId }
    });

    // Fetch all chat logs
    const chats = await prisma.chatLog.findMany({
      where: { businessProfileId: chatbot.businessProfileId },
      orderBy: { createdAt: 'desc' },
      take: 5000 // Limit to 5000 for serverless stability
    });

    // Fetch all orders
    const orders = await prisma.order.findMany({
      where: { businessProfileId: chatbot.businessProfileId }
    });

    const exportData = {
      exportDate: new Date().toISOString(),
      businessId: chatbot.businessProfileId,
      totalLeads: leads.length,
      totalChatsExported: chats.length,
      totalOrders: orders.length,
      data: {
        leads,
        chats,
        orders
      }
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="chatbisnis-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });

  } catch (error) {
    console.error('Export Backup Error:', error);
    return NextResponse.json({ error: 'Gagal mengekspor data' }, { status: 500 });
  }
}
