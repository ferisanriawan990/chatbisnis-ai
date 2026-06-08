import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WAHAService } from '@/lib/waha';
import { syncWahaServerSessionCount } from '@/lib/waha-session-sync';

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

    if (!chatbot.wahaSessionName) {
      return NextResponse.json(
        { error: 'Tidak ada sesi WAHA aktif untuk dihentikan.' },
        { status: 400 },
      );
    }

    // Check current session status for idempotency
    const wpSession = await prisma.whatsAppSession.findUnique({
      where: { sessionName: chatbot.wahaSessionName },
    });

    if (wpSession && wpSession.status === 'disconnected') {
      // Already stopped — idempotent success
      return NextResponse.json({ success: true, message: 'Sesi sudah dihentikan sebelumnya.' });
    }

    // Read config from WahaServer relation
    const wahaServer = chatbot.wahaServer;
    if (!wahaServer || !wahaServer.apiKeyEncrypted) {
      // Server missing — just mark DB as disconnected
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
      await waha.stopSession(chatbot.wahaSessionName);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown';
      // Log but don't block — still update DB to disconnected
      console.error('WAHA stopSession call failed (will still update DB):', msg);
    }

    // Update DB safely regardless of WAHA call result
    await prisma.whatsAppSession.updateMany({
      where: { sessionName: chatbot.wahaSessionName },
      data: { status: 'disconnected', lastError: null },
    });

    // Sync accurate counter
    if (chatbot.wahaServerId) {
      await syncWahaServerSessionCount(chatbot.wahaServerId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('WAHA Stop Error:', message);
    return NextResponse.json({ error: `Gagal menghentikan sesi WAHA: ${message}` }, { status: 500 });
  }
}
