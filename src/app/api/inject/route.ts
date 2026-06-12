import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';

export async function GET() {
  try {
    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@chatbisnis.id' } });
    const adminSetting = await prisma.chatbotSetting.findFirst({ where: { userId: adminUser?.id } });
    const userSetting = await prisma.chatbotSetting.findFirst({ where: { userId: '9f88ad77-60c5-47d6-a257-0fdf4c3564d0' } });
    
    const globalKey = await prisma.secretCredential.findUnique({ where: { key: 'FLAZ_API_KEY_GLOBAL' } });

    return NextResponse.json({ 
      success: true, 
      admin: adminSetting?.aiApiKeyEncrypted ? decrypt(adminSetting.aiApiKeyEncrypted) : null,
      user: userSetting?.aiApiKeyEncrypted ? decrypt(userSetting.aiApiKeyEncrypted) : null,
      global: globalKey?.encryptedValue ? decrypt(globalKey.encryptedValue) : null
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
