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
    const requestedSessionName = body.sessionName?.trim() || undefined; // If starting an existing session
    const isNew = body.isNew === true; // If specifically asking to create a new one

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
      return NextResponse.json({ error: `Chatbot setting tidak ditemukan untuk userId: ${userId}` }, { status: 404 });
    }

    const maxSessions = chatbot.user.subscriptions[0]?.plan.maxWhatsappSessions ?? 1;
    
    // Count active and starting sessions
    const currentSessionsCount = await prisma.whatsAppSession.count({
      where: {
        userId,
        status: { notIn: ['disconnected', 'failed'] },
      },
    });

    let targetSessionName = requestedSessionName;
    let existingSession = null;

    if (targetSessionName) {
      existingSession = await prisma.whatsAppSession.findFirst({
        where: { userId, sessionName: targetSessionName }
      });
      if (!existingSession) {
        return NextResponse.json({ error: 'Sesi tidak ditemukan' }, { status: 404 });
      }
      // If we are starting an existing disconnected session, check if it pushes us over quota
      if (['disconnected', 'failed'].includes(existingSession.status) && currentSessionsCount >= maxSessions) {
        return NextResponse.json({ error: `Batas maksimal WhatsApp session aktif tercapai (${maxSessions}). Hentikan sesi lain terlebih dahulu.` }, { status: 403 });
      }
    } else {
      // Trying to create a new session or start the default one
      if (currentSessionsCount >= maxSessions) {
        return NextResponse.json({ error: `Batas maksimal WhatsApp session aktif tercapai (${maxSessions}).` }, { status: 403 });
      }

      // Generate a new session name based on count
      const totalStoredCount = await prisma.whatsAppSession.count({ where: { userId } });
      const baseName = getActiveWhatsappSessionName(userId, chatbot.businessProfileId);
      
      // If it's the very first session, use baseName. Otherwise append a number.
      if (totalStoredCount === 0) {
        targetSessionName = baseName;
      } else {
        // Find a unique name
        let index = totalStoredCount + 1;
        while (true) {
          targetSessionName = `${baseName}-${index}`;
          const check = await prisma.whatsAppSession.findFirst({ where: { sessionName: targetSessionName } });
          if (!check) break;
          index++;
        }
      }
    }

    const resolved = await BaileysService.resolveInstance(chatbot.id);
    const gateway = resolved.gateway;
    const serverId = resolved.serverId;
    
    // START the session via Gateway
    const info = await gateway.startSession(targetSessionName, phoneNumber);
    const status = info.status === 'connected' ? 'connected' : info.status === 'qr' ? 'qr' : 'starting';
    const pairingCode = info.pairingCode;

    if (existingSession) {
      await prisma.whatsAppSession.update({
        where: { id: existingSession.id },
        data: {
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
          sessionName: targetSessionName,
          status,
          lastConnectedAt: status === 'connected' ? new Date() : null,
        },
      });
    }

    return NextResponse.json({ success: true, sessionName: targetSessionName, status, pairingCode });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Baileys Start Error:', message);
    return NextResponse.json({ error: `Gagal memulai sesi WhatsApp: ${message}` }, { status: 502 });
  }
}

