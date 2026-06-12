import { NextResponse } from 'next/server';
import { getRequiredAdminOrResponse, validateAdminMutationOrigin } from '@/lib/admin-helper';
import { prisma } from '@/lib/prisma';
import { decrypt, encrypt } from '@/lib/crypto';
import { AIService } from '@/lib/ai';
import { getConfiguredGlobalAIModel } from '@/lib/ai-config';
import { z } from 'zod';

const updateCredentialSchema = z.object({
  isActive: z.boolean().optional(),
  value: z.string().min(1).max(500).optional(),
  description: z.string().max(1000).optional(),
});

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

    const parsed = updateCredentialSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }
    const body = parsed.data;
    const { id } = await params;

    const existing = await prisma.secretCredential.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Credential tidak ditemukan' }, { status: 404 });
    }

    const isFlazCredential = existing.key === 'FLAZ_API_KEY_GLOBAL'
      || existing.provider.toLowerCase() === 'flaz';
    const valueToValidate = body.value
      || (body.isActive === true && isFlazCredential ? decrypt(existing.encryptedValue) : null);

    if (valueToValidate && isFlazCredential) {
      if (!valueToValidate.startsWith('sk-')) {
        return NextResponse.json({ error: 'API Key Flaz Cloud harus diawali dengan sk-' }, { status: 400 });
      }
      const validation = await AIService.validateCredential(
        valueToValidate,
        await getConfiguredGlobalAIModel(),
      );
      if (!validation.ok) {
        return NextResponse.json(
          { error: validation.error || 'API Key Flaz Cloud tidak valid.' },
          { status: 400 },
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (typeof body.isActive === 'boolean') {
      updateData.isActive = body.isActive;
    }
    
    if (body.value) {
      updateData.encryptedValue = encrypt(body.value);
      updateData.lastRotatedAt = new Date();
    }
    if (body.description !== undefined) {
      updateData.description = body.description;
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
