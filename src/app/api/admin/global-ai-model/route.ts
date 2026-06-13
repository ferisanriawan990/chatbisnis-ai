import { NextResponse } from 'next/server';
import { getRequiredAdminOrResponse, validateAdminMutationOrigin } from '@/lib/admin-helper';
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/crypto';
import { AIService } from '@/lib/ai';
import { SUPPORTED_AI_MODELS } from '@/lib/ai-config';
import { z } from 'zod';

const modelSchema = z.object({
  model: z.enum(SUPPORTED_AI_MODELS),
});

export async function GET() {
  try {
    const admin = await getRequiredAdminOrResponse();
    if (admin instanceof NextResponse) return admin;

    const cred = await prisma.secretCredential.findUnique({
      where: { key: 'GLOBAL_AI_MODEL' }
    });

    let model = 'gemini-2.5-flash-lite';
    if (cred && cred.isActive) {
      try {
        model = decrypt(cred.encryptedValue);
      } catch {
        // fallback
      }
    }

    return NextResponse.json({ model });
  } catch (error) {
    console.error('Error fetching global AI model:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const originError = validateAdminMutationOrigin(req);
    if (originError) return originError;

    const admin = await getRequiredAdminOrResponse();
    if (admin instanceof NextResponse) return admin;

    const parsed = modelSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Model AI tidak didukung' }, { status: 400 });
    }
    const { model } = parsed.data;

    const globalKey = await prisma.secretCredential.findUnique({
      where: { key: 'FLAZ_API_KEY_GLOBAL' },
    });
    if (!globalKey?.isActive) {
      return NextResponse.json({ error: 'Global API Key belum aktif' }, { status: 400 });
    }

    const validation = await AIService.validateCredential(decrypt(globalKey.encryptedValue), model);
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.error || 'Model tidak dapat digunakan dengan Global API Key.' },
        { status: 400 },
      );
    }

    const encryptedValue = encrypt(model);

    await prisma.secretCredential.upsert({
      where: { key: 'GLOBAL_AI_MODEL' },
      update: { encryptedValue, isActive: true },
      create: {
        name: 'Global AI Model',
        key: 'GLOBAL_AI_MODEL',
        provider: 'system',
        encryptedValue,
        description: 'Model AI default yang digunakan secara global',
        isActive: true,
      }
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'UPDATE_GLOBAL_AI_MODEL',
        entityType: 'SecretCredential',
        metadataJson: JSON.stringify({ model }),
      },
    });

    return NextResponse.json({ success: true, model });
  } catch (error) {
    console.error('Error saving global AI model:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
