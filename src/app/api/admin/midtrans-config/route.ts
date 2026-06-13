import { NextResponse } from 'next/server';
import { getRequiredAdminOrResponse, validateAdminMutationOrigin } from '@/lib/admin-helper';
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/crypto';
import { z } from 'zod';

const configSchema = z.object({
  clientKey: z.string().min(1),
  serverKey: z.string().optional(), // Optional on update if they don't want to change it
  isProduction: z.boolean(),
});

export async function GET() {
  try {
    const admin = await getRequiredAdminOrResponse();
    if (admin instanceof NextResponse) return admin;

    const isProdSetting = await prisma.systemSetting.findUnique({ where: { key: 'MIDTRANS_IS_PRODUCTION' } });
    const clientKeySetting = await prisma.systemSetting.findUnique({ where: { key: 'MIDTRANS_CLIENT_KEY' } });
    const serverKeyCred = await prisma.secretCredential.findUnique({ where: { key: 'MIDTRANS_SERVER_KEY' } });

    return NextResponse.json({
      isProduction: isProdSetting?.value === 'true',
      clientKey: clientKeySetting?.value || '',
      hasServerKey: !!(serverKeyCred && serverKeyCred.isActive && serverKeyCred.encryptedValue),
    });
  } catch (error) {
    console.error('Error fetching midtrans config:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const originError = validateAdminMutationOrigin(req);
    if (originError) return originError;

    const admin = await getRequiredAdminOrResponse();
    if (admin instanceof NextResponse) return admin;

    const parsed = configSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });
    }
    const { clientKey, serverKey, isProduction } = parsed.data;

    await prisma.systemSetting.upsert({
      where: { key: 'MIDTRANS_IS_PRODUCTION' },
      update: { value: isProduction ? 'true' : 'false' },
      create: {
        key: 'MIDTRANS_IS_PRODUCTION',
        value: isProduction ? 'true' : 'false',
        type: 'boolean',
        description: 'Midtrans Production Mode',
      }
    });

    await prisma.systemSetting.upsert({
      where: { key: 'MIDTRANS_CLIENT_KEY' },
      update: { value: clientKey },
      create: {
        key: 'MIDTRANS_CLIENT_KEY',
        value: clientKey,
        type: 'string',
        description: 'Midtrans Client Key',
      }
    });

    if (serverKey && serverKey.trim() !== '') {
      const encryptedValue = encrypt(serverKey);
      await prisma.secretCredential.upsert({
        where: { key: 'MIDTRANS_SERVER_KEY' },
        update: { encryptedValue, isActive: true },
        create: {
          name: 'Midtrans Server Key',
          key: 'MIDTRANS_SERVER_KEY',
          provider: 'midtrans',
          encryptedValue,
          description: 'Kunci rahasia untuk autentikasi backend Midtrans',
          isActive: true,
        }
      });
    }

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'UPDATE_MIDTRANS_CONFIG',
        entityType: 'SystemSetting',
        metadataJson: JSON.stringify({ isProduction, clientKeyUpdated: true, serverKeyUpdated: !!serverKey }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving midtrans config:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
