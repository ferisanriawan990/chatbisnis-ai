import { prisma } from './prisma';

/**
 * Returns the global WhatsApp core mode.
 * Default is 'true' if not set.
 */
export function getWhatsappCoreMode(): boolean {
  if (process.env.WHATSAPP_CORE_MODE === undefined) return true;
  return process.env.WHATSAPP_CORE_MODE === 'true';
}

/**
 * Generates a unique, deterministic WhatsApp session name for a user or business profile.
 * E.g., user-12345 or biz-67890
 */
export function getActiveWhatsappSessionName(userId: string, businessProfileId?: string | null): string {
  if ((process.env.WHATSAPP_PROVIDER || 'baileys').toLowerCase() === 'baileys') {
    return businessProfileId ? `biz-${businessProfileId}` : `user-${userId}`;
  }
  if (getWhatsappCoreMode()) {
    return 'default';
  }
  if (businessProfileId) {
    return `biz-${businessProfileId}`;
  }
  return `user-${userId}`;
}

/**
 * Resolves the appropriate WhatsApp Server ID to use for a user.
 * If the user has a specific server assigned via their active ChatbotSetting, it returns it.
 * Otherwise, it attempts to find a global or default WhatsApp Server.
 */
export async function resolveWhatsappServerForUser(userId: string): Promise<string | null> {
  const setting = await prisma.chatbotSetting.findFirst({
    where: { userId, isActive: true },
    select: { whatsappServerId: true }
  });
  if (setting?.whatsappServerId) {
    return setting.whatsappServerId;
  }
  
  // Fallback to a global/default server if available
  const defaultServer = await prisma.whatsappServer.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' }
  });
  
  return defaultServer?.id || null;
}

/**
 * Asserts that a given user owns the specified WhatsApp session.
 * This prevents cross-tenant actions like stopping another user's session.
 */
export async function assertUserOwnsWhatsappSession(userId: string, sessionName: string): Promise<boolean> {
  const setting = await prisma.chatbotSetting.findFirst({
    where: { userId, whatsappSessionName: sessionName }
  });
  return !!setting;
}
