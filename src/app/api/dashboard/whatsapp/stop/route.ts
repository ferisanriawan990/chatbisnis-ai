import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BaileysApiError, BaileysService } from '@/lib/baileys';
import { getActiveWhatsappSessionName } from '@/lib/whatsapp-helpers';

export async function POST() {
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (authSession.user as { id: string }).id;
    const chatbot = await prisma.chatbotSetting.findFirst({ where: { userId } });
    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot setting tidak ditemukan' }, { status: 404 });
    }

    const sessionName = getActiveWhatsappSessionName(userId, chatbot.businessProfileId);
    try {
      await BaileysService.fromEnv().logoutSession(sessionName);
    } catch (error) {
      if (!(error instanceof BaileysApiError && error.status === 404)) throw error;
    }

    await prisma.whatsAppSession.updateMany({
      where: { userId, chatbotSettingId: chatbot.id },
      data: { status: 'disconnected', lastError: null },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Baileys Stop Error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Gagal menghentikan sesi WhatsApp' }, { status: 502 });
  }
}
