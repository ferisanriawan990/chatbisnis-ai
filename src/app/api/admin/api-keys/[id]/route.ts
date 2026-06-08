import { NextResponse } from 'next/server';
import { getRequiredAdminOrResponse, validateAdminMutationOrigin } from '@/lib/admin-helper';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const originError = validateAdminMutationOrigin(req);
    if (originError) return originError;

    const admin = await getRequiredAdminOrResponse();
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;

    await prisma.secretCredential.delete({
      where: { id }
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'DELETE_API_KEY',
        entityType: 'SecretCredential',
        entityId: id,
      }
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const originError = validateAdminMutationOrigin(req);
    if (originError) return originError;

    const admin = await getRequiredAdminOrResponse();
    if (admin instanceof NextResponse) return admin;

    const body = await req.json();
    const { id } = await params;

    const updateData: Record<string, unknown> = {};
    if (typeof body.isActive === 'boolean') {
      updateData.isActive = body.isActive;
    }
    
    if (body.value) {
      updateData.encryptedValue = encrypt(body.value);
      updateData.lastRotatedAt = new Date();
    }

    const credential = await prisma.secretCredential.update({
      where: { id },
      data: updateData
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: body.value ? 'ROTATE_API_KEY' : 'UPDATE_API_KEY_STATUS',
        entityType: 'SecretCredential',
        entityId: credential.id,
      }
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
