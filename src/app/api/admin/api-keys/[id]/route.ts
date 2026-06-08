import { NextResponse } from 'next/server';
import { getRequiredAdminOrResponse } from '@/lib/admin-helper';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';
import { z } from 'zod';

const updateApiKeySchema = z.object({
  name: z.string().optional(),
  value: z.string().optional(),
  isActive: z.boolean().optional(),
  description: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getRequiredAdminOrResponse();    if (admin instanceof NextResponse) return admin;

    const body = await req.json();
    const parsed = updateApiKeySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.value) {
      updateData.encryptedValue = encrypt(parsed.data.value);
      updateData.lastRotatedAt = new Date();
      delete updateData.value;
    }

    const credential = await prisma.secretCredential.update({
      where: { id: (await params).id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'UPDATE_API_KEY',
        entityType: 'SecretCredential',
        entityId: credential.id,
      }
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getRequiredAdminOrResponse();    if (admin instanceof NextResponse) return admin;

    await prisma.secretCredential.delete({
      where: { id: (await params).id },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'DELETE_API_KEY',
        entityType: 'SecretCredential',
        entityId: (await params).id,
      }
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
