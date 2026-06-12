import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';

export async function GET() {
  try {
    const wahaServer = await prisma.wahaServer.findUnique({ where: { id: 'bd809b58-b1d5-4c3c-8139-8c0b51d9ba12' } });
    if (!wahaServer) return NextResponse.json({ error: 'Not found' });
    
    const decryptedKey = decrypt(wahaServer.apiKeyEncrypted);
    return NextResponse.json({ success: true, key: decryptedKey });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
