import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';

export async function GET() {
  try {
    const globalKey = await prisma.secretCredential.findUnique({ where: { key: 'FLAZ_API_KEY_GLOBAL' } });
    if (!globalKey) return NextResponse.json({ error: 'Not found' });
    
    const decryptedKey = decrypt(globalKey.encryptedValue);
    return NextResponse.json({ success: true, key: decryptedKey });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
