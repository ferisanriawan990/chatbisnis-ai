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

    if (!chatbot.wahaBaseUrl || !chatbot.wahaApiKeyEncrypted || !chatbot.wahaSessionName) {
      return NextResponse.json(
        { error: 'WAHA Base URL, API Key, dan Session Name harus disiapkan terlebih dahulu.' },
        { status: 400 }
      );
    }

    const waha = WAHAService.fromEncrypted(chatbot.wahaBaseUrl, chatbot.wahaApiKeyEncrypted);
    
    try {
      await waha.stopSession(chatbot.wahaSessionName);
      
      // Update DB safely
      await prisma.$transaction(async (tx) => {
        // 1. Update session status
        await tx.whatsAppSession.updateMany({
          where: { sessionName: chatbot.wahaSessionName },
          data: { status: 'disconnected', lastError: null }
        });

        // 2. Decrement server usage if wahaServerId is valid
        if (chatbot.wahaServerId) {
          const server = await tx.wahaServer.findUnique({ where: { id: chatbot.wahaServerId } });
          if (server && server.currentSessions > 0) {
            await tx.wahaServer.update({
              where: { id: server.id },
              data: { currentSessions: { decrement: 1 } }
            });
          }
        }
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      // Record the failure
      await prisma.whatsAppSession.updateMany({
        where: { sessionName: chatbot.wahaSessionName },
        data: { status: 'failed', lastError: message }
      });
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Gagal menghentikan sesi WAHA: ${message}` }, { status: 500 });
  }
}
