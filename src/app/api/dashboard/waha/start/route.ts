import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BaileysService } from '@/lib/baileys';
import { getActiveWahaSessionName } from '@/lib/waha-helpers';

export async function POST() {
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (authSession.user as { id: string }).id;
    const chatbot = await prisma.chatbotSetting.findFirst({
      where: { userId },
      include: {
        user: {
          include: {
            subscriptions: {
              where: { status: 'active' },
              include: { plan: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot setting tidak ditemukan' }, { status: 404 });
    }

    const sessionName = getActiveWahaSessionName(userId, chatbot.businessProfileId);
    const existingSession = await prisma.whatsAppSession.findFirst({
      where: { userId, chatbotSettingId: chatbot.id },
    });
    const hasActiveCurrentSession = existingSession
      && ['starting', 'qr', 'connected'].includes(existingSession.status);

    if (!hasActiveCurrentSession) {
      const maxSessions = chatbot.user.subscriptions[0]?.plan.maxWhatsappSessions ?? 1;
      const currentSessions = await prisma.whatsAppSession.count({
        where: {
          userId,
          status: { in: ['starting', 'qr', 'connected'] },
          ...(existingSession ? { id: { not: existingSession.id } } : {}),
        },
      });
      if (currentSessions >= maxSessions) {
        return NextResponse.json(
          { error: `Batas maksimal WhatsApp session tercapai (${maxSessions}).` },
          { status: 403 },
        );
      }
    }

    if (chatbot.wahaSessionName !== sessionName) {
      await prisma.chatbotSetting.update({
        where: { id: chatbot.id },
        data: { wahaSessionName: sessionName },
      });
    }

    const gateway = BaileysService.fromEnv();
    const info = await gateway.startSession(sessionName);
    const status = info.status === 'connected' ? 'connected' : info.status === 'qr' ? 'qr' : 'starting';

    if (existingSession) {
      await prisma.whatsAppSession.update({
        where: { id: existingSession.id },
        data: {
          sessionName,
          wahaServerId: null,
          status,
          lastError: null,
          lastConnectedAt: status === 'connected' ? new Date() : existingSession.lastConnectedAt,
        },
      });
    } else {
      await prisma.whatsAppSession.create({
        data: {
          userId,
          businessProfileId: chatbot.businessProfileId,
          chatbotSettingId: chatbot.id,
          sessionName,
          status,
          lastConnectedAt: status === 'connected' ? new Date() : null,
        },
      });
    }

    return NextResponse.json({ success: true, sessionName, status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Baileys Start Error:', message);
    return NextResponse.json({ error: `Gagal memulai sesi WhatsApp: ${message}` }, { status: 502 });
  }
}
