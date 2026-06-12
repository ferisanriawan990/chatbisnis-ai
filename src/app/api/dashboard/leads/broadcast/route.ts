import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WAHAService } from '@/lib/waha';
import { getActiveWahaSessionName, assertUserOwnsWahaSession } from '@/lib/waha-helpers';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { leadIds, messageText } = await req.json();

    if (!Array.isArray(leadIds) || leadIds.length === 0 || !messageText) {
      return NextResponse.json({ error: 'Data tidak lengkap (leadIds atau messageText kosong).' }, { status: 400 });
    }

    const chatbot = await prisma.chatbotSetting.findFirst({
      where: { userId },
      include: { wahaServer: true },
    });

    if (!chatbot || !chatbot.wahaServer || !chatbot.wahaServer.apiKeyEncrypted) {
      return NextResponse.json({ error: 'WhatsApp belum terhubung atau konfigurasi bot tidak ditemukan.' }, { status: 400 });
    }

    const activeSessionName = getActiveWahaSessionName(userId, chatbot.businessProfileId);
    if (!(await assertUserOwnsWahaSession(userId, activeSessionName))) {
       return NextResponse.json({ error: 'Sesi WhatsApp tidak valid.' }, { status: 400 });
    }

    const waha = WAHAService.fromEncrypted(chatbot.wahaServer.baseUrl, chatbot.wahaServer.apiKeyEncrypted);
    
    // Check Status First
    const status = await waha.getStatus(activeSessionName);
    if (status !== 'connected') {
      return NextResponse.json({ error: 'WhatsApp bot sedang tidak terhubung. Silakan hubungkan ulang di menu pengaturan.' }, { status: 400 });
    }

    // Ambil Data Leads
    const leads = await prisma.lead.findMany({
      where: {
        id: { in: leadIds },
        userId: userId, // Pastikan milik user yang login
      }
    });

    if (leads.length === 0) {
      return NextResponse.json({ error: 'Lead tidak ditemukan.' }, { status: 404 });
    }

    let successCount = 0;
    let failCount = 0;

    for (const lead of leads) {
      try {
        const phone = lead.customerPhone.replace(/[^0-9]/g, '');
        if (!phone) continue;

        // Custom template substitution
        let personalizedMsg = messageText;
        if (lead.customerName) {
           personalizedMsg = personalizedMsg.replace(/{{name}}/gi, lead.customerName);
        } else {
           personalizedMsg = personalizedMsg.replace(/{{name}}/gi, 'Kak');
        }

        await waha.sendMessage(activeSessionName, phone, personalizedMsg);
        
        // Log ke ChatLog sebagai outbound system message
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
          }
        });

        successCount++;
      } catch (err) {
        console.error(`Failed to broadcast to ${lead.customerPhone}`, err);
        failCount++;
      }
    }

    return NextResponse.json({ success: true, successCount, failCount });
  } catch (error) {
    console.error('POST /api/dashboard/leads/broadcast Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
