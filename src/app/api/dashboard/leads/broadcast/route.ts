import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BaileysService } from '@/lib/baileys';
import { getActiveWhatsappSessionName } from '@/lib/whatsapp-helpers';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { leadIds, messageText } = await req.json();
    if (!Array.isArray(leadIds) || leadIds.length === 0 || typeof messageText !== 'string' || !messageText.trim()) {
      return NextResponse.json({ error: 'Data lead atau isi pesan tidak lengkap.' }, { status: 400 });
    }

    const chatbot = await prisma.chatbotSetting.findFirst({ where: { userId } });
    if (!chatbot) {
      return NextResponse.json({ error: 'Konfigurasi chatbot tidak ditemukan.' }, { status: 404 });
    }

    const sessionName = getActiveWhatsappSessionName(userId, chatbot.businessProfileId);
    const gateway = BaileysService.fromEnv();
    const status = await gateway.getStatus(sessionName).catch(() => null);
    if (status?.normalizedStatus !== 'connected') {
      return NextResponse.json({ error: 'WhatsApp belum terhubung.' }, { status: 409 });
    }

    const leads = await prisma.lead.findMany({
      where: { id: { in: leadIds }, userId },
    });
    if (leads.length === 0) {
      return NextResponse.json({ error: 'Lead tidak ditemukan.' }, { status: 404 });
    }

    const batchId = crypto.randomUUID();
    let successCount = 0;
    let failCount = 0;

    for (const lead of leads) {
      try {
        const phone = lead.customerPhone.replace(/[^0-9]/g, '');
        if (!phone) {
          failCount += 1;
          continue;
        }

        const personalizedMsg = messageText.replace(/{{name}}/gi, lead.customerName || 'Kak');
        await gateway.sendMessage(sessionName, phone, personalizedMsg, `broadcast:${batchId}:${lead.id}`);
        await prisma.chatLog.create({
          data: {
            userId,
            businessProfileId: chatbot.businessProfileId,
            chatbotSettingId: chatbot.id,
            customerPhone: lead.customerPhone,
            customerName: lead.customerName || '',
            messageIn: '[SYSTEM_BROADCAST_OUTBOUND]',
            messageOut: personalizedMsg,
            status: 'success',
            intent: 'broadcast_or_followup',
          },
        });
        successCount += 1;
      } catch (error) {
        console.error(`Broadcast failed for lead=${lead.id}:`, error instanceof Error ? error.message : error);
        failCount += 1;
      }
    }

    return NextResponse.json({ success: true, successCount, failCount });
  } catch (error) {
    console.error('POST broadcast error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
