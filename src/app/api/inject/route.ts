import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';

export async function GET() {
  try {
    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@chatbisnis.id' } });
    if (!adminUser) return NextResponse.json({ error: 'admin not found' });

    const apiKey = 'sk-8IlFhbWOaXqJMgkZLTGyqA';
    const encryptedAiApiKey = encrypt(apiKey);

    await prisma.chatbotSetting.updateMany({
      where: { userId: adminUser.id },
      data: { aiApiKeyEncrypted: encryptedAiApiKey }
    });

    return NextResponse.json({ success: true, encryptedAiApiKey });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
