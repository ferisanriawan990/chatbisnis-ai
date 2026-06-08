import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WAHAService } from '@/lib/waha';
import crypto from 'crypto';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    let chatbot = await prisma.chatbotSetting.findFirst({ where: { userId } });

    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot setting tidak ditemukan' }, { status: 404 });
    }

    let newlyAssignedServerId: string | null = null;

    // Dynamic Server Assignment using transaction to ensure safety
    if (!chatbot.wahaServerId) {
      const assigned = await prisma.$transaction(async (tx) => {
        const servers = await tx.wahaServer.findMany({ where: { isActive: true } });
        const availableServer = servers.find(s => s.currentSessions < s.maxSessions);

        if (!availableServer) {
          throw new Error('SERVER_FULL');
        }

        const randomString = crypto.randomBytes(4).toString('hex');
        const sessionName = `chatbisnis_${userId}_${randomString}`;

        // Increment server usage
        await tx.wahaServer.update({
          where: { id: availableServer.id },
          data: { currentSessions: { increment: 1 } }
        });

        // Update chatbot setting
        const updatedChatbot = await tx.chatbotSetting.update({
          where: { id: chatbot!.id },
          data: {
            wahaServerId: availableServer.id,
            wahaBaseUrl: availableServer.baseUrl,
            wahaApiKeyEncrypted: availableServer.apiKeyEncrypted,
            wahaSessionName: sessionName,
          }
        });

        return { server: availableServer, chatbot: updatedChatbot };
      });

      chatbot = assigned.chatbot;
      newlyAssignedServerId = assigned.server.id;
    }

    if (!chatbot.wahaBaseUrl || !chatbot.wahaApiKeyEncrypted) {
      return NextResponse.json(
        { error: 'Konfigurasi WAHA tidak valid pada server.' },
        { status: 500 }
      );
    }

    const waha = WAHAService.fromEncrypted(chatbot.wahaBaseUrl, chatbot.wahaApiKeyEncrypted);
    
    try {
      await waha.startSession(chatbot.wahaSessionName);
    } catch (error) {
      const msg = (error as { message?: string })?.message || '';
      
      if (msg.includes('already started')) {
        return NextResponse.json({ success: true, sessionName: chatbot.wahaSessionName, alreadyStarted: true });
      }

      // Rollback currentSessions if we just assigned it and WAHA failed
      if (newlyAssignedServerId) {
        await prisma.$transaction([
          prisma.wahaServer.update({
            where: { id: newlyAssignedServerId },
            data: { currentSessions: { decrement: 1 } }
          }),
          prisma.chatbotSetting.update({
            where: { id: chatbot.id },
            data: { wahaServerId: null, wahaBaseUrl: null, wahaApiKeyEncrypted: null, wahaSessionName: '' }
          })
        ]).catch(e => console.error('Failed to rollback waha server assignment:', e));
      }

      throw error;
    }

    // Ensure session exists in DB
    await prisma.whatsAppSession.upsert({
      where: { sessionName: chatbot.wahaSessionName },
      create: {
        userId,
        businessProfileId: chatbot.businessProfileId,
        chatbotSettingId: chatbot.id,
        wahaServerId: chatbot.wahaServerId,
        sessionName: chatbot.wahaSessionName,
        status: 'starting'
      },
      update: {
        status: 'starting',
        lastError: null
      }
    });

    return NextResponse.json({ success: true, sessionName: chatbot.wahaSessionName });
  } catch (error) {
    console.error('WAHA Start Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    if (message === 'SERVER_FULL') {
      return NextResponse.json(
        { error: 'Maaf, semua server WhatsApp saat ini sedang penuh. Silakan coba lagi nanti atau hubungi Admin.' },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: `Gagal memulai sesi WAHA: ${message}` }, { status: 500 });
  }
}
