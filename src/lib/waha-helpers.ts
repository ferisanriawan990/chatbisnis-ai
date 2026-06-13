import { prisma } from './prisma';

/**
 * Returns the global WAHA core mode.
 * Default is 'true' if not set.
 */
export function getWahaCoreMode(): boolean {
  if (process.env.WAHA_CORE_MODE === undefined) return true;
  return process.env.WAHA_CORE_MODE === 'true';
}

/**
 * Generates a unique, deterministic WAHA session name for a user or business profile.
 * E.g., user-12345 or biz-67890
 */
export function getActiveWahaSessionName(userId: string, businessProfileId?: string | null): string {
  if ((process.env.WHATSAPP_PROVIDER || 'baileys').toLowerCase() === 'baileys') {
    return businessProfileId ? `biz-${businessProfileId}` : `user-${userId}`;
  }
  if (getWahaCoreMode()) {
    return 'default';
  }
  if (businessProfileId) {
    return `biz-${businessProfileId}`;
  }
  return `user-${userId}`;
}

/**
 * Resolves the appropriate WAHA Server ID to use for a user.
 * If the user has a specific server assigned via their active ChatbotSetting, it returns it.
 * Otherwise, it attempts to find a global or default WAHA Server.
 */
export async function resolveWahaServerForUser(userId: string): Promise<string | null> {
  const setting = await prisma.chatbotSetting.findFirst({
    where: { userId, isActive: true },
    select: { wahaServerId: true }
  });
  if (setting?.wahaServerId) {
    return setting.wahaServerId;
  }
  
  // Fallback to a global/default server if available
  const defaultServer = await prisma.wahaServer.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' }
  });
  
  return defaultServer?.id || null;
}

/**
 * Asserts that a given user owns the specified WAHA session.
 * This prevents cross-tenant actions like stopping another user's session.
 */
export async function assertUserOwnsWahaSession(userId: string, sessionName: string): Promise<boolean> {
  const setting = await prisma.chatbotSetting.findFirst({
    where: { userId, wahaSessionName: sessionName }
  });
  return !!setting;
}
