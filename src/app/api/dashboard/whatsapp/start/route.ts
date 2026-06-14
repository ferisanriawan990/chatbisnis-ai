import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BaileysService } from '@/lib/baileys';
import { getActiveWhatsappSessionName } from '@/lib/whatsapp-helpers';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const phoneNumber = body.phoneNumber?.trim() || undefined;

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
              where: { status: 'active', OR: [{ expiredAt: null }, { expiredAt: { gt: new Date() } }] },
              include: { plan: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!chatbot) {
      console.error("DEBUG: chatbot not found for userId", userId); return NextResponse.json({ error: `Chatbot setting tidak ditemukan untuk userId: ${userId}` }, { status: 404 });
    }

    const sessionName = getActiveWhatsappSessionName(userId, chatbot.businessProfileId);
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

    if (chatbot.whatsappSessionName !== sessionName) {
      await prisma.chatbotSetting.update({
        where: { id: chatbot.id },
        data: { whatsappSessionName: sessionName },
      });
    }

    const resolved = await BaileysService.resolveInstance(chatbot.id);
    const gateway = resolved.gateway;
    const serverId = resolved.serverId;
    const info = await gateway.startSession(sessionName, phoneNumber);
    const status = info.status === 'connected' ? 'connected' : info.status === 'qr' ? 'qr' : 'starting';
    const pairingCode = info.pairingCode;

    if (existingSession) {
      await prisma.whatsAppSession.update({
        where: { id: existingSession.id },
        data: {
          sessionName,
          whatsappServerId: serverId,
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
          whatsappServerId: serverId,
          sessionName,
          status,
          lastConnectedAt: status === 'connected' ? new Date() : null,
        },
      });
    }

    return NextResponse.json({ success: true, sessionName, status, pairingCode });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Baileys Start Error:', message);
    return NextResponse.json({ error: `Gagal memulai sesi WhatsApp: ${message}` }, { status: 502 });
  }
}
