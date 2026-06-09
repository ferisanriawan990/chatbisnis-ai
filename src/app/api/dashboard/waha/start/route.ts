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
    let chatbot = await prisma.chatbotSetting.findFirst({
      where: { userId },
      include: { wahaServer: true },
    });

    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot setting tidak ditemukan' }, { status: 404 });
    }

    let newlyAssignedServerId: string | null = null;

    // Dynamic Server Assignment using transaction to ensure safety
    if (!chatbot.wahaServerId) {
      const assigned = await prisma.$transaction(async (tx) => {
        const servers = await tx.wahaServer.findMany({
          where: { isActive: true },
        });
        const availableServer = servers.find(
          (s) => s.currentSessions < s.maxSessions && s.apiKeyEncrypted,
        );

        if (!availableServer) {
          throw new Error('SERVER_FULL');
        }

        const isCoreMode = process.env.WAHA_CORE_MODE !== 'false';
        const sessionName = isCoreMode ? 'default' : `waha_plus_${userId}`;

        if (isCoreMode) {
          const existingDefault = await tx.chatbotSetting.findFirst({
            where: { wahaServerId: availableServer.id, wahaSessionName: 'default' }
          });
          if (existingDefault && existingDefault.userId !== userId) {
            throw new Error('WAHA_CORE_TAKEN');
          }
        }

        // Increment server usage (will be synced accurately after)
        await tx.wahaServer.update({
          where: { id: availableServer.id },
          data: { currentSessions: { increment: 1 } },
        });

        // Update chatbot setting with serverId and sessionName only
        const updatedChatbot = await tx.chatbotSetting.update({
          where: { id: chatbot!.id },
          data: {
            wahaServerId: availableServer.id,
            wahaSessionName: sessionName,
          },
          include: { wahaServer: true },
        });

        return { server: availableServer, chatbot: updatedChatbot };
      });

      chatbot = assigned.chatbot;
      newlyAssignedServerId = assigned.server.id;
    }

    const isCoreMode = process.env.WAHA_CORE_MODE !== 'false';
    const needsDefaultUpdate = isCoreMode && (
      chatbot.wahaSessionName !== 'default' || 
      chatbot.wahaSessionName.startsWith('chatbisnis_') || 
      chatbot.wahaSessionName.startsWith('session_')
    );

    if (needsDefaultUpdate) {
      const existingDefault = await prisma.chatbotSetting.findFirst({ 
        where: { 
          wahaServerId: chatbot.wahaServerId,
          wahaSessionName: 'default',
          isActive: true
        } 
      });

      if (existingDefault && existingDefault.userId !== userId) {
        return NextResponse.json({ error: 'WAHA Core hanya mendukung 1 nomor WhatsApp. Session default sudah dipakai oleh chatbot lain. Nonaktifkan session lama atau upgrade ke WAHA Plus.' }, { status: 400 });
      }
      
      try {
        chatbot = await prisma.chatbotSetting.update({
          where: { id: chatbot.id },
          data: { wahaSessionName: 'default' },
          include: { wahaServer: true },
        });
      } catch (err: unknown) {
        const prismaErr = err as { code?: string };
        if (prismaErr.code === 'P2002') {
          return NextResponse.json({ error: 'WAHA Core hanya mendukung 1 nomor WhatsApp. Session default sudah dipakai oleh chatbot lain. Nonaktifkan session lama atau upgrade ke WAHA Plus.' }, { status: 400 });
        }
        throw err;
      }
    }

    // Always read config from WahaServer relation
    const wahaServer = chatbot.wahaServer;
    if (!wahaServer || !wahaServer.isActive) {
      return NextResponse.json(
        { error: 'Server WAHA tidak tersedia atau tidak aktif.' },
        { status: 503 },
      );
    }

    if (!wahaServer.apiKeyEncrypted) {
      return NextResponse.json(
        { error: 'Server WAHA tidak memiliki API Key yang dikonfigurasi.' },
        { status: 500 },
      );
    }

    const waha = WAHAService.fromEncrypted(wahaServer.baseUrl, wahaServer.apiKeyEncrypted);

    try {
      await waha.startSession(chatbot.wahaSessionName);
    } catch (error) {
      const msg = (error as { message?: string })?.message || '';

      if (msg.includes('already started')) {
        // Session already exists — ensure DB record exists
        const existingSession = await prisma.whatsAppSession.findFirst({
          where: { wahaServerId: chatbot.wahaServerId, sessionName: chatbot.wahaSessionName }
        });
        if (existingSession) {
          await prisma.whatsAppSession.update({
            where: { id: existingSession.id },
            data: { status: 'connected', lastError: null },
          });
        } else {
          await prisma.whatsAppSession.create({
            data: {
              userId,
              businessProfileId: chatbot.businessProfileId,
              chatbotSettingId: chatbot.id,
              wahaServerId: chatbot.wahaServerId!,
              sessionName: chatbot.wahaSessionName,
              status: 'connected',
            }
          });
        }
        if (chatbot.wahaServerId) {
          await syncWahaServerSessionCount(chatbot.wahaServerId);
        }
        return NextResponse.json({
          success: true,
          sessionName: chatbot.wahaSessionName,
          alreadyStarted: true,
        });
      }

      // Rollback: remove server assignment but KEEP session name for debugging
      if (newlyAssignedServerId) {
        await prisma.chatbotSetting
          .update({
            where: { id: chatbot.id },
            data: { wahaServerId: null },
          })
          .catch((e: unknown) => {
            const msg = e instanceof Error ? e.message : 'unknown';
            console.error('Failed to rollback waha server assignment:', msg);
          });
        await syncWahaServerSessionCount(newlyAssignedServerId).catch(() => {});
      }

      throw error;
    }

    // Ensure session exists in DB
    const existingSession = await prisma.whatsAppSession.findFirst({
      where: { wahaServerId: chatbot.wahaServerId, sessionName: chatbot.wahaSessionName }
    });
    
    if (existingSession) {
      await prisma.whatsAppSession.update({
        where: { id: existingSession.id },
        data: { status: 'starting', lastError: null },
      });
    } else {
      await prisma.whatsAppSession.create({
        data: {
          userId,
          businessProfileId: chatbot.businessProfileId,
          chatbotSettingId: chatbot.id,
          wahaServerId: chatbot.wahaServerId!,
          sessionName: chatbot.wahaSessionName,
          status: 'starting',
        }
      });
    }

    // Sync accurate counter
    if (chatbot.wahaServerId) {
      await syncWahaServerSessionCount(chatbot.wahaServerId);
    }

    return NextResponse.json({ success: true, sessionName: chatbot.wahaSessionName });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'SERVER_FULL') {
      return NextResponse.json(
        {
          error:
            'Maaf, semua server WhatsApp saat ini sedang penuh. Silakan coba lagi nanti atau hubungi Admin.',
        },
        { status: 503 },
      );
    }

    if (message === 'WAHA_CORE_TAKEN') {
      return NextResponse.json(
        {
          error:
            'WAHA Core hanya mendukung 1 nomor WhatsApp per server, dan server ini sudah digunakan oleh akun lain. Harap hubungi Admin atau upgrade ke WAHA Plus.',
        },
        { status: 400 },
      );
    }

    console.error('WAHA Start Error:', message);
    return NextResponse.json({ error: `Gagal memulai sesi WAHA: ${message}` }, { status: 500 });
  }
}
