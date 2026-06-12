import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';

export async function GET() {
  try {
    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@chatbisnis.id' } });
    const chatbotSetting = await prisma.chatbotSetting.findFirst({ where: { userId: adminUser?.id } });
    if (!chatbotSetting) return NextResponse.json({ error: 'Not found' });
    
    const decryptedKey = decrypt(chatbotSetting.aiApiKeyEncrypted || '');
    return NextResponse.json({ success: true, key: decryptedKey });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
