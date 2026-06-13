import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { subDays, startOfDay } from 'date-fns';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as { id: string }).id;

    // Fetch the active chatbot setting
    const chatbotSetting = await prisma.chatbotSetting.findFirst({
      where: { userId, isActive: true },
      select: { id: true, businessProfileId: true }
    });

    if (!chatbotSetting) {
      return NextResponse.json({ error: 'Chatbot Setting not found' }, { status: 404 });
    }

    const thirtyDaysAgo = startOfDay(subDays(new Date(), 29)); // Last 30 days for export

    // Get orders for revenue
    const orders = await prisma.order.findMany({
      where: {
        businessProfileId: chatbotSetting.businessProfileId,
        createdAt: { gte: thirtyDaysAgo },
        status: { in: ['completed', 'paid'] }
      },
      select: { orderNumber: true, totalAmount: true, customerName: true, customerPhone: true, status: true, createdAt: true }
    });

    // Get Chat Logs summary
    const chats = await prisma.chatLog.findMany({
      where: {
        chatbotSettingId: chatbotSetting.id,
        createdAt: { gte: thirtyDaysAgo }
      },
      select: { customerPhone: true, needsHuman: true, messageIn: true, createdAt: true }
    });

    // Format as CSV
    let csvStr = "Laporan Analitik - ChatBisnis AI\n";
    csvStr += "Periode: 30 Hari Terakhir\n\n";

    // Utility function to prevent CSV injection
    const sanitizeCsvField = (field: string) => {
      const sanitized = field.replace(/(\r\n|\n|\r|,)/gm, " ");
      if (/^[=+\-@]/.test(sanitized)) {
        return `'${sanitized}`;
      }
      return sanitized;
    };

    // Orders Section
    csvStr += "--- DATA PENJUALAN ---\n";
    csvStr += "Tanggal,Order ID,Customer,WhatsApp,Status,Total (Rp)\n";
    for (const order of orders) {
      const date = order.createdAt.toISOString().split('T')[0];
      const name = sanitizeCsvField(order.customerName || '');
      csvStr += `${date},${order.orderNumber},${name},${order.customerPhone},${order.status},${order.totalAmount}\n`;
    }

    csvStr += "\n--- DATA CHAT & HANDOVER ---\n";
    csvStr += "Tanggal,WhatsApp,Pesan Terakhir,Status AI\n";
    // To prevent giant CSVs, we'll only take the last 1000 messages or just raw logs.
    const recentChats = chats.slice(-1000); // Max 1000 logs
    for (const chat of recentChats) {
      const date = chat.createdAt.toISOString().split('T')[0];
      const msg = sanitizeCsvField(chat.messageIn || '').substring(0, 50);
      const status = chat.needsHuman ? 'Handover Admin' : 'Dijawab AI';
      csvStr += `${date},${chat.customerPhone},${msg},${status}\n`;
    }

    return new NextResponse(csvStr, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="analytics_report.csv"',
      },
    });

  } catch (error) {
    console.error(`GET /api/dashboard/analytics/export Error:`, (error as Error).message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
