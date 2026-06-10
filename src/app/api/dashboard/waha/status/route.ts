import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WAHAService } from '@/lib/waha';
import { syncWahaServerSessionCount } from '@/lib/waha-session-sync';
import { getWahaCoreMode, getActiveWahaSessionName, assertUserOwnsWahaSession } from '@/lib/waha-helpers';

export async function GET() {
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
    const isCoreMode = getWahaCoreMode();

    if (!(await assertUserOwnsWahaSession(userId, activeSessionName))) {
       return NextResponse.json({ status: 'disconnected', isCoreMode });
    }

    const wahaServer = chatbot.wahaServer;
    if (!wahaServer || !wahaServer.apiKeyEncrypted) {
      return NextResponse.json({ status: 'disconnected', isCoreMode });
    }

    let statusValue = 'disconnected';
    try {
      const waha = WAHAService.fromEncrypted(wahaServer.baseUrl, wahaServer.apiKeyEncrypted);
      statusValue = await waha.getStatus(activeSessionName);
    } catch {
      statusValue = 'disconnected';
    }

    const wpSession = await prisma.whatsAppSession.findFirst({
      where: { sessionName: activeSessionName },
    });

    if (wpSession && wpSession.status !== statusValue) {
      await prisma.whatsAppSession.update({
        where: { id: wpSession.id },
        data: {
          status: statusValue,
          lastConnectedAt: statusValue === 'connected' ? new Date() : wpSession.lastConnectedAt,
        },
      });

      if (chatbot.wahaServerId) {
        await syncWahaServerSessionCount(chatbot.wahaServerId);
      }
    }

    return NextResponse.json({
      status: statusValue,
      sessionName: activeSessionName,
      serverName: wahaServer.name,
      lastConnectedAt: wpSession?.lastConnectedAt,
      lastError: wpSession?.lastError,
      isCoreMode,
    });
  } catch (error) {
    console.error('GET /api/dashboard/waha/status Error:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ status: 'disconnected' });
  }
}
