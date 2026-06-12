import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';

export async function GET() {
  try {
    const userId = '9f88ad77-60c5-47d6-a257-0fdf4c3564d0';
    const apiKey = 'sk-8IlFhbWOaXqJMgkZLTGyqA';
    
    const encryptedAiApiKey = encrypt(apiKey);

    await prisma.chatbotSetting.updateMany({
      where: { userId },
      data: { aiApiKeyEncrypted: encryptedAiApiKey }
    });

    return NextResponse.json({ success: true, encryptedAiApiKey });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
