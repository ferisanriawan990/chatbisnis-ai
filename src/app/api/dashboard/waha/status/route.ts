import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WAHAService } from '@/lib/waha';

export async function GET() {
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
      return NextResponse.json({ status: 'disconnected' });
    }

    const waha = WAHAService.fromEncrypted(chatbot.wahaBaseUrl, chatbot.wahaApiKeyEncrypted);
    const status = await waha.getStatus(chatbot.wahaSessionName);

    return NextResponse.json({ status });
  } catch (error) {
    console.error('GET /api/dashboard/waha/status Error:', error);
    return NextResponse.json({ status: 'disconnected' });
  }
}
