import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { prisma } from './prisma';
import { NextResponse } from 'next/server';
import { assertSameOrigin } from './security';

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, email: true, name: true }
  });

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return user;
}

export async function getRequiredAdminOrResponse() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
  }
  return user;
}

export function validateAdminMutationOrigin(req: Request) {
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ error: 'Invalid Origin/Referer (CSRF Protection)' }, { status: 403 });
  }
  return null;
}

export async function logAdminAction(
  actorUserId: string,
  action: string,
  entityType: string,
  entityId?: string,
  metadata?: Record<string, unknown>
) {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action,
        entityType,
        entityId,
        metadataJson: metadata ? JSON.stringify(metadata) : null,
      }
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}
