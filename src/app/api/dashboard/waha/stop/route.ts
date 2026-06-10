import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WAHAService } from '@/lib/waha';
import { syncWahaServerSessionCount } from '@/lib/waha-session-sync';
import { getActiveWahaSessionName, assertUserOwnsWahaSession } from '@/lib/waha-helpers';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const chatbot = await prisma.chatbotSetting.findFirst({
      where: { userId },
      include: { wahaServer: true },
    });

    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot setting tidak ditemukan' }, { status: 404 });
    }

    const activeSessionName = getActiveWahaSessionName(userId, chatbot.businessProfileId);

    if (!(await assertUserOwnsWahaSession(userId, activeSessionName))) {
       return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const wpSession = await prisma.whatsAppSession.findFirst({
      where: { sessionName: activeSessionName },
    });

    if (wpSession && wpSession.status === 'disconnected') {
      return NextResponse.json({ success: true, message: 'Sesi sudah dihentikan sebelumnya.' });
    }

    const wahaServer = chatbot.wahaServer;
    if (!wahaServer || !wahaServer.apiKeyEncrypted) {
      if (wpSession) {
        await prisma.whatsAppSession.update({
          where: { id: wpSession.id },
          data: { status: 'disconnected' },
        });
        if (chatbot.wahaServerId) {
          await syncWahaServerSessionCount(chatbot.wahaServerId);
        }
      }
      return NextResponse.json({ success: true, message: 'Sesi ditandai disconnected (server tidak tersedia).' });
    }

    const waha = WAHAService.fromEncrypted(wahaServer.baseUrl, wahaServer.apiKeyEncrypted);

    try {
      await waha.stopSession(activeSessionName);
    } catch (err) {
      console.error('WAHA stopSession call failed:', err instanceof Error ? err.message : 'unknown');
    }

    await prisma.whatsAppSession.updateMany({
      where: { sessionName: activeSessionName },
      data: { status: 'disconnected', lastError: null },
    });

    if (chatbot.wahaServerId) {
      await syncWahaServerSessionCount(chatbot.wahaServerId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('WAHA Stop Error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Gagal menghentikan sesi WAHA' }, { status: 500 });
  }
}
