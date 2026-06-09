import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WAHAService } from '@/lib/waha';

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.INTERNAL_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const providedSecret = req.headers.get('x-n8n-secret');
    if (providedSecret !== webhookSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { sessionName, customerPhone, messageOut, tokenUsage } = body;
    const wahaServerId = req.headers.get('x-waha-server-id') || undefined;

    if (!sessionName || !customerPhone || !messageOut) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const whereClause: any = { wahaSessionName: sessionName };
    if (wahaServerId) whereClause.wahaServerId = wahaServerId;

    const chatbotSetting = await prisma.chatbotSetting.findFirst({
      where: whereClause,
      include: { businessProfile: true, wahaServer: true }
    });

    if (!chatbotSetting) {
      return NextResponse.json({ error: 'Chatbot not configured' }, { status: 404 });
    }

    if (chatbotSetting.wahaServer?.apiKeyEncrypted) {
      const wahaServer = chatbotSetting.wahaServer;
      const waha = WAHAService.fromEncrypted(wahaServer.baseUrl, wahaServer.apiKeyEncrypted || '');
      await waha.sendMessage(sessionName, customerPhone, messageOut);
    } else if (chatbotSetting.wahaApiKeyEncrypted && chatbotSetting.wahaBaseUrl) {
      const waha = WAHAService.fromEncrypted(chatbotSetting.wahaBaseUrl, chatbotSetting.wahaApiKeyEncrypted || '');
      await waha.sendMessage(sessionName, customerPhone, messageOut);
    } else {
      return NextResponse.json({ error: 'WAHA connection not configured' }, { status: 400 });
    }

    // Log the message and usage
    await prisma.chatLog.create({
      data: {
        userId: chatbotSetting.userId,
        businessProfileId: chatbotSetting.businessProfileId,
        chatbotSettingId: chatbotSetting.id,
        customerPhone,
        customerName: null,
        messageIn: '[via n8n]',
        messageOut,
        status: 'success',
        aiUsed: 'n8n-workflow',
        tokenUsage: typeof tokenUsage === 'number' ? tokenUsage : 0,
        needsHuman: false,
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;

    await prisma.usageCounter.upsert({
      where: { userId_date: { userId: chatbotSetting.userId, date: today } },
      create: {
        userId: chatbotSetting.userId,
        businessProfileId: chatbotSetting.businessProfileId,
        date: today,
        month: monthStr,
        aiChats: 1,
        whatsappMessages: 1,
        aiTokens: typeof tokenUsage === 'number' ? tokenUsage : 0,
      },
      update: {
        aiChats: { increment: 1 },
        whatsappMessages: { increment: 1 },
        aiTokens: { increment: typeof tokenUsage === 'number' ? tokenUsage : 0 },
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('N8N Webhook Response Error:', (error as Error).message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
