import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WAHAService } from '@/lib/waha';
import { syncWahaServerSessionCount } from '@/lib/waha-session-sync';
import crypto from 'crypto';

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

        const isCoreMode = process.env.WAHA_CORE_MODE === 'true';
        const sessionName = isCoreMode ? 'default' : `chatbisnis_${userId}_${crypto.randomBytes(4).toString('hex')}`;

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
        await prisma.whatsAppSession.upsert({
          where: { sessionName: chatbot.wahaSessionName },
          create: {
            userId,
            businessProfileId: chatbot.businessProfileId,
            chatbotSettingId: chatbot.id,
            wahaServerId: chatbot.wahaServerId!,
            sessionName: chatbot.wahaSessionName,
            status: 'connected',
          },
          update: { status: 'connected', lastError: null },
        });
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
    await prisma.whatsAppSession.upsert({
      where: { sessionName: chatbot.wahaSessionName },
      create: {
        userId,
        businessProfileId: chatbot.businessProfileId,
        chatbotSettingId: chatbot.id,
        wahaServerId: chatbot.wahaServerId!,
        sessionName: chatbot.wahaSessionName,
        status: 'starting',
      },
      update: { status: 'starting', lastError: null },
    });

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

    console.error('WAHA Start Error:', message);
    return NextResponse.json({ error: `Gagal memulai sesi WAHA: ${message}` }, { status: 500 });
  }
}
