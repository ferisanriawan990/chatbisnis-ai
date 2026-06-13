import { NextResponse } from 'next/server';
import { getRequiredAdminOrResponse, validateAdminMutationOrigin } from '@/lib/admin-helper';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';
import { AIService } from '@/lib/ai';
import { getConfiguredGlobalAIModel } from '@/lib/ai-config';
import { z } from 'zod';

const apiKeySchema = z.object({
  name: z.string().min(1),
  key: z.string().min(1),
  value: z.string().min(1),
  provider: z.string().min(1),
  description: z.string().optional(),
});

export async function GET() {
  try {
    const admin = await getRequiredAdminOrResponse();    if (admin instanceof NextResponse) return admin;
    const keys = await prisma.secretCredential.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const maskedKeys = keys.map(k => ({
      id: k.id,
      name: k.name,
      key: k.key,
      provider: k.provider,
      description: k.description,
      isActive: k.isActive,
      isConfigured: true,
      maskedValue: '••••••••',
      createdAt: k.createdAt,
      updatedAt: k.updatedAt,
      lastRotatedAt: k.lastRotatedAt
    }));

    return NextResponse.json(maskedKeys);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const originError = validateAdminMutationOrigin(req);
    if (originError) return originError;

    const admin = await getRequiredAdminOrResponse();
    if (admin instanceof NextResponse) return admin;

    const body = await req.json();
    const parsed = apiKeySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    if (parsed.data.key === 'FLAZ_API_KEY_GLOBAL' || parsed.data.provider.toLowerCase() === 'flaz') {
      if (!parsed.data.value.startsWith('sk-')) {
        return NextResponse.json({ error: 'API Key Flaz Cloud harus diawali dengan sk-' }, { status: 400 });
      }

      let validation = await AIService.validateCredential(
        parsed.data.value,
        await getConfiguredGlobalAIModel(),
      );

      if (!validation.ok) {
        console.warn('Initial validation failed, trying fallbacks...');
        const fallbacks = ['gemini-2.5-flash-lite', 'gpt-4o-mini', 'gemini-1.5-flash'];
        for (const fb of fallbacks) {
          validation = await AIService.validateCredential(parsed.data.value, fb);
          if (validation.ok) break;
        }
      }

      if (!validation.ok) {
        return NextResponse.json(
          { error: validation.error || 'API Key Flaz Cloud tidak valid.' },
          { status: 400 },
        );
      }
    }

    const encryptedValue = encrypt(parsed.data.value);

    const credential = await prisma.secretCredential.create({
      data: {
        name: parsed.data.name,
        key: parsed.data.key,
        provider: parsed.data.provider,
        description: parsed.data.description,
        encryptedValue,
        lastRotatedAt: new Date(),
      }
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'CREATE_API_KEY',
        entityType: 'SecretCredential',
        entityId: credential.id,
      }
    });

    return NextResponse.json({ success: true, id: credential.id });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Key already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
