import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WAHAService } from '@/lib/waha';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const chatbot = await prisma.chatbotSetting.findFirst({ where: { userId } });

    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot setting tidak ditemukan' }, { status: 404 });
    }

    if (!chatbot.wahaBaseUrl || !chatbot.wahaApiKeyEncrypted) {
      return NextResponse.json(
        { error: 'WAHA Base URL dan API Key harus diisi terlebih dahulu.' },
        { status: 400 }
      );
    }

    const waha = WAHAService.fromEncrypted(chatbot.wahaBaseUrl, chatbot.wahaApiKeyEncrypted);
    await waha.startSession(chatbot.wahaSessionName);

    return NextResponse.json({ success: true, sessionName: chatbot.wahaSessionName });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Gagal memulai sesi WAHA: ${message}` }, { status: 500 });
  }
}
