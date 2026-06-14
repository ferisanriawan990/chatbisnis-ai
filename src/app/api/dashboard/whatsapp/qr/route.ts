import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BaileysApiError, BaileysService } from '@/lib/baileys';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionName = searchParams.get('sessionName');

    if (!sessionName) {
      return NextResponse.json({ error: 'Parameter sessionName diperlukan' }, { status: 400 });
    }

    const authSession = await getServerSession(authOptions);
    if (!authSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (authSession.user as { id: string }).id;
    const chatbot = await prisma.chatbotSetting.findFirst({ where: { userId } });
    if (!chatbot) {
      return NextResponse.json({ error: `Chatbot setting tidak ditemukan untuk userId: ${userId}` }, { status: 404 });
    }

    // Verify ownership
    const sessionRecord = await prisma.whatsAppSession.findFirst({
      where: { userId, sessionName }
    });
    
    if (!sessionRecord) {
      return NextResponse.json({ error: 'Sesi tidak ditemukan atau bukan milik Anda' }, { status: 403 });
    }

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

