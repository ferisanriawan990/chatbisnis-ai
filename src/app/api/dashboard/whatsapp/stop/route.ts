import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BaileysApiError, BaileysService } from '@/lib/baileys';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const sessionName = body.sessionName?.trim();

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
      return NextResponse.json({ error: 'Chatbot setting tidak ditemukan' }, { status: 404 });
    }

    const sessionRecord = await prisma.whatsAppSession.findFirst({
      where: { userId, sessionName }
    });

    if (!sessionRecord) {
      return NextResponse.json({ error: 'Sesi tidak ditemukan atau bukan milik Anda' }, { status: 403 });
    }

    try {
      const resolved = await BaileysService.resolveInstance(chatbot.id);
      const gateway = resolved.gateway;
      await gateway.logoutSession(sessionName);
    } catch (error) {
      if (!(error instanceof BaileysApiError && error.status === 404)) throw error;
    }

    await prisma.whatsAppSession.update({
      where: { id: sessionRecord.id },
      data: { status: 'disconnected', lastError: null },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Baileys Stop Error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Gagal menghentikan sesi WhatsApp' }, { status: 502 });
  }
}

