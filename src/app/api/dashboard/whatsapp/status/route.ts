import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BaileysApiError, BaileysService } from '@/lib/baileys';

export async function GET() {
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (authSession.user as { id: string }).id;
    
    // Get user's active plan quota
    const userWithSub = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: 'active' },
          include: { plan: true },
        }
      }
    });
    
    const maxSessions = userWithSub?.subscriptions?.[0]?.plan?.maxWhatsappSessions || 1;

    const chatbot = await prisma.chatbotSetting.findFirst({ where: { userId } });
    if (!chatbot) {
      return NextResponse.json({ sessions: [], maxSessions, isCoreMode: false });
    }

    const storedSessions = await prisma.whatsAppSession.findMany({
      where: { userId, chatbotSettingId: chatbot.id },
      orderBy: { createdAt: 'asc' },
    });

    const activeSessions = [];

    // Loop through all stored sessions and check status
    for (const storedSession of storedSessions) {
      let status = 'disconnected';
      let phoneNumber: string | null = null;
      let lastError = storedSession.lastError || null;
      try {
        const { gateway } = await BaileysService.resolveInstance(chatbot.id);
        const info = await gateway.getStatus(storedSession.sessionName);
        status = info.normalizedStatus;
        phoneNumber = info.phoneNumber;
        lastError = info.lastError;
      } catch (error) {
        if (!(error instanceof BaileysApiError && error.status === 404)) {
          if (error instanceof Error && !error.message.includes('404')) {
             // We ignore the error and leave status as disconnected
          }
        }
      }

      // Update if status changed
      if (storedSession.status !== status || storedSession.lastError !== lastError) {
        await prisma.whatsAppSession.update({
          where: { id: storedSession.id },
          data: {
            status,
            lastError,
            lastConnectedAt: status === 'connected' ? new Date() : storedSession.lastConnectedAt,
          },
        });
      }

      activeSessions.push({
        id: storedSession.id,
        sessionName: storedSession.sessionName,
        status,
        phoneNumber,
        lastConnectedAt: storedSession.lastConnectedAt,
        lastError,
      });
    }

    return NextResponse.json({
      sessions: activeSessions,
      maxSessions,
      isCoreMode: false,
    });
  } catch (error) {
    console.error('GET WhatsApp status error:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({
      sessions: [],
      maxSessions: 1,
      error: 'Gateway WhatsApp tidak dapat dijangkau',
      isCoreMode: false,
    });
  }
}

