import { prisma } from './prisma';

interface AuditLogPayload {
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAudit(payload: AuditLogPayload) {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: payload.actorUserId,
        action: payload.action,
        entityType: payload.entityType,
        entityId: payload.entityId,
        metadataJson: payload.metadata ? JSON.stringify(payload.metadata) : null,
        ipAddress: payload.ipAddress,
        userAgent: payload.userAgent,
      }
    });
  } catch (error) {
    console.error('[AuditLogger] Failed to write audit log:', error);
    // We don't throw here to prevent blocking the main business logic
  }
}
