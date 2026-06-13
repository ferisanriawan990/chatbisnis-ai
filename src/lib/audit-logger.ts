import { prisma } from './prisma';

interface LogAuditParams {
  actorUserId?: string;
  businessProfileId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAudit(params: LogAuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: params.actorUserId || null,
        businessProfileId: params.businessProfileId || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        metadataJson: params.metadata ? JSON.stringify(params.metadata) : null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      }
    });
  } catch (error) {
    // We intentionally swallow audit log errors so it doesn't break the main application flow,
    // but we log it to standard error for debugging purposes.
    console.error('Failed to write audit log:', error);
  }
}
