import { prisma } from './prisma';

/**
 * Recounts active WhatsApp sessions for a given WhatsappServer
 * and updates currentSessions to the accurate count.
 * Ensures currentSessions never goes negative.
 */
export async function syncWhatsappServerSessionCount(serverId: string): Promise<void> {
  try {
    const count = await prisma.whatsAppSession.count({
      where: {
        whatsappServerId: serverId,
        status: { in: ['starting', 'qr', 'connected'] },
      },
    });

    await prisma.whatsappServer.update({
      where: { id: serverId },
      data: { currentSessions: Math.max(0, count) },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error(`[syncWhatsappServerSessionCount] Failed for serverId=${serverId}: ${msg}`);
  }
}
