import { NextResponse } from 'next/server';
import { getRequiredAdminOrResponse } from '@/lib/admin-helper';
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/crypto';

export async function GET() {
  try {
    const admin = await getRequiredAdminOrResponse();
    if (admin instanceof NextResponse) return admin;

    const cred = await prisma.secretCredential.findUnique({
      where: { key: 'GLOBAL_AI_MODEL' }
    });

    let model = 'gpt-4o-mini';
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
    const admin = await getRequiredAdminOrResponse();
    if (admin instanceof NextResponse) return admin;

    const { model } = await req.json();
    if (!model) {
      return NextResponse.json({ error: 'Model wajib diisi' }, { status: 400 });
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

    return NextResponse.json({ success: true, model });
  } catch (error) {
    console.error('Error saving global AI model:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
