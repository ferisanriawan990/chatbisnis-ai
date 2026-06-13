import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BaileysApiError, BaileysService } from '@/lib/baileys';
import { getActiveWhatsappSessionName } from '@/lib/whatsapp-helpers';

export async function GET() {
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (authSession.user as { id: string }).id;
    const chatbot = await prisma.chatbotSetting.findFirst({ where: { userId } });
    if (!chatbot) {
      return NextResponse.json({ status: 'disconnected', isCoreMode: false });
    }

    const sessionName = getActiveWhatsappSessionName(userId, chatbot.businessProfileId);
    const storedSession = await prisma.whatsAppSession.findFirst({
      where: { userId, chatbotSettingId: chatbot.id },
    });

    let status = 'disconnected';
    let phoneNumber: string | null = null;
    let lastError = storedSession?.lastError || null;
    try {
      const { gateway } = await BaileysService.resolveInstance(chatbot.id);
      const info = await gateway.getStatus(sessionName);
      status = info.normalizedStatus;
      phoneNumber = info.phoneNumber;
      lastError = info.lastError;
    } catch (error) {
      if (!(error instanceof BaileysApiError && error.status === 404)) throw error;
    }

    if (storedSession && (storedSession.status !== status || storedSession.lastError !== lastError)) {
      await prisma.whatsAppSession.update({
        where: { id: storedSession.id },
        data: {
          sessionName,
          status,
          lastError,
          lastConnectedAt: status === 'connected' ? new Date() : storedSession.lastConnectedAt,
        },
      });
    }

    return NextResponse.json({
      status,
      sessionName,
      serverName: 'Baileys Gateway',
      phoneNumber,
      lastConnectedAt: storedSession?.lastConnectedAt,
      lastError,
      isCoreMode: false,
    });
  } catch (error) {
    console.error('GET WhatsApp status error:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({
      status: 'disconnected',
      error: 'Gateway WhatsApp tidak dapat dijangkau',
      isCoreMode: false,
    });
  }
}
