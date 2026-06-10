import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WAHAService } from '@/lib/waha';
import { syncWahaServerSessionCount } from '@/lib/waha-session-sync';
import { getWahaCoreMode, getActiveWahaSessionName } from '@/lib/waha-helpers';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    let chatbot = await prisma.chatbotSetting.findFirst({
      where: { userId },
      include: { 
        wahaServer: true, 
        businessProfile: true,
        user: { 
          include: { 
            subscriptions: { 
              include: { plan: true }, 
              where: { status: 'active' } 
            } 
          } 
        }
      },
    });

    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot setting tidak ditemukan' }, { status: 404 });
    }

    const maxSessions = chatbot.user?.subscriptions?.[0]?.plan?.maxWhatsappSessions ?? 1;
    const currentSessions = await prisma.whatsAppSession.count({
      where: { userId, status: { not: 'disconnected' } }
    });

    if (currentSessions >= maxSessions) {
      return NextResponse.json(
        { error: `Batas maksimal WhatsApp session tercapai (${maxSessions}). Upgrade plan untuk menambah session.` },
        { status: 403 }
      );
    }

    const isCoreMode = getWahaCoreMode();
    const sessionName = getActiveWahaSessionName(userId, chatbot.businessProfileId);

    let newlyAssignedServerId: string | null = null;

    if (!chatbot.wahaServerId) {
      const assigned = await prisma.$transaction(async (tx) => {
        const servers = await tx.wahaServer.findMany({
          where: { isActive: true },
        });

        let availableServer = null;

        for (const s of servers) {
          if (s.currentSessions >= s.maxSessions || !s.apiKeyEncrypted) continue;

          if (isCoreMode) {
            // Check if server is already occupied by ANY session not owned by user
            const existingSession = await tx.whatsAppSession.findFirst({
              where: { wahaServerId: s.id, status: { not: 'disconnected' } }
            });
            if (existingSession && existingSession.userId !== userId) {
              continue;
            }
          }
          
          availableServer = s;
          break;
        }

        if (!availableServer) {
          if (isCoreMode && servers.length > 0) {
             throw new Error('WAHA_CORE_TAKEN');
          }
          throw new Error('SERVER_FULL');
        }

        await tx.wahaServer.update({
          where: { id: availableServer.id },
          data: { currentSessions: { increment: 1 } },
        });

        const updatedChatbot = await tx.chatbotSetting.update({
          where: { id: chatbot!.id },
          data: {
            wahaServerId: availableServer.id,
            wahaSessionName: sessionName,
          },
          include: { wahaServer: true, businessProfile: true, user: { include: { subscriptions: { include: { plan: true }, where: { status: 'active' } } } } },
        });

        return { server: availableServer, chatbot: updatedChatbot };
      });

      chatbot = assigned.chatbot;
      newlyAssignedServerId = assigned.server.id;
    } else {
      // If server is already assigned, just ensure session name is updated
      if (chatbot.wahaSessionName !== sessionName) {
        chatbot = await prisma.chatbotSetting.update({
          where: { id: chatbot.id },
          data: { wahaSessionName: sessionName },
          include: { wahaServer: true, businessProfile: true, user: { include: { subscriptions: { include: { plan: true }, where: { status: 'active' } } } } },
        });
      }
    }

    const wahaServer = chatbot.wahaServer;
    if (!wahaServer || !wahaServer.isActive) {
      return NextResponse.json({ error: 'Server WAHA tidak tersedia atau tidak aktif.' }, { status: 503 });
    }

    if (!wahaServer.apiKeyEncrypted) {
      return NextResponse.json({ error: 'Server WAHA tidak memiliki API Key yang dikonfigurasi.' }, { status: 500 });
    }

    const waha = WAHAService.fromEncrypted(wahaServer.baseUrl, wahaServer.apiKeyEncrypted);

    try {
      await waha.startSession(sessionName);
    } catch (error) {
      const msg = (error as { message?: string })?.message || '';

      if (msg.includes('already started')) {
        const existingSession = await prisma.whatsAppSession.findFirst({
          where: { wahaServerId: chatbot.wahaServerId, sessionName }
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
              sessionName: sessionName,
              status: 'connected',
            }
          });
        }
        if (chatbot.wahaServerId) {
          await syncWahaServerSessionCount(chatbot.wahaServerId);
        }
        return NextResponse.json({ success: true, sessionName, alreadyStarted: true });
      }

      if (newlyAssignedServerId) {
        await prisma.chatbotSetting.update({
          where: { id: chatbot.id },
          data: { wahaServerId: null },
        }).catch(() => {});
        await syncWahaServerSessionCount(newlyAssignedServerId).catch(() => {});
      }

      throw error;
    }

    const existingSession = await prisma.whatsAppSession.findFirst({
      where: { wahaServerId: chatbot.wahaServerId, sessionName }
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
          sessionName: sessionName,
          status: 'starting',
        }
      });
    }

    if (chatbot.wahaServerId) {
      await syncWahaServerSessionCount(chatbot.wahaServerId);
    }

    return NextResponse.json({ success: true, sessionName });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'SERVER_FULL') {
      return NextResponse.json(
        { error: 'Maaf, semua server WhatsApp saat ini sedang penuh. Silakan coba lagi nanti atau hubungi Admin.' },
        { status: 503 }
      );
    }

    if (message === 'WAHA_CORE_TAKEN') {
      return NextResponse.json(
        { error: 'WAHA Core hanya mendukung 1 nomor WhatsApp per server, dan server ini sudah digunakan oleh akun lain. Harap hubungi Admin atau upgrade ke WAHA Plus.' },
        { status: 400 }
      );
    }

    console.error('WAHA Start Error:', message);
    return NextResponse.json({ error: `Gagal memulai sesi WAHA: ${message}` }, { status: 500 });
  }
}
