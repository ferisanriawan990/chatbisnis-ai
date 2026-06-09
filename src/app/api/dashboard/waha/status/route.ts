import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WAHAService } from '@/lib/waha';
import { syncWahaServerSessionCount } from '@/lib/waha-session-sync';

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

    // Read config from WahaServer relation
    const wahaServer = chatbot.wahaServer;
    if (!wahaServer || !wahaServer.apiKeyEncrypted || !chatbot.wahaSessionName) {
      return NextResponse.json({ status: 'disconnected' });
    }

    let statusValue = 'disconnected';
    try {
      const waha = WAHAService.fromEncrypted(wahaServer.baseUrl, wahaServer.apiKeyEncrypted);
      statusValue = await waha.getStatus(chatbot.wahaSessionName);
    } catch {
      statusValue = 'disconnected';
    }

    // Get last connection data
    const wpSession = await prisma.whatsAppSession.findUnique({
      where: { sessionName: chatbot.wahaSessionName },
    });

    // Update session status in DB if changed
    if (wpSession && wpSession.status !== statusValue) {
      await prisma.whatsAppSession.update({
        where: { id: wpSession.id },
        data: {
          status: statusValue,
          lastConnectedAt:
            statusValue === 'connected' ? new Date() : wpSession.lastConnectedAt,
        },
      });

      // Sync counter when status changes
      if (chatbot.wahaServerId) {
        await syncWahaServerSessionCount(chatbot.wahaServerId);
      }
    }

    return NextResponse.json({
      status: statusValue,
      sessionName: chatbot.wahaSessionName,
      serverName: wahaServer.name,
      lastConnectedAt: wpSession?.lastConnectedAt,
      lastError: wpSession?.lastError,
      isCoreMode: process.env.WAHA_CORE_MODE === 'true',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown';
    console.error('GET /api/dashboard/waha/status Error:', msg);
    return NextResponse.json({ status: 'disconnected' });
  }
}
