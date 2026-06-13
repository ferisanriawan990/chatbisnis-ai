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
      console.error("DEBUG: chatbot not found for userId", userId); return NextResponse.json({ error: `Chatbot setting tidak ditemukan untuk userId: ${userId}` }, { status: 404 });
    }

    const sessionName = getActiveWhatsappSessionName(userId, chatbot.businessProfileId);
    const resolved = await BaileysService.resolveInstance(chatbot.id);
    const gateway = resolved.gateway;
    const info = await gateway.getQR(sessionName);
    return NextResponse.json({ qr: info?.qrDataUrl || info?.qr, updatedAt: info?.updatedAt });
  } catch (error) {
    if (error instanceof BaileysApiError && error.code === 'QR_NOT_AVAILABLE') {
      return NextResponse.json({ qr: null }, { status: 202 });
    }
    console.error('GET WhatsApp QR error:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Gagal mengambil QR WhatsApp' }, { status: 502 });
  }
}
