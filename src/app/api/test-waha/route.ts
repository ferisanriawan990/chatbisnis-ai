import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WAHAService } from '@/lib/waha';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const phone = url.searchParams.get('phone');
  const imageUrl = url.searchParams.get('image');
  
  if (!phone || !imageUrl) return NextResponse.json({ error: 'Missing phone or image params' }, { status: 400 });

  try {
    const setting = await prisma.chatbotSetting.findFirst();
    if (!setting) return NextResponse.json({ error: 'No chatbot setting' });

    let waha: WAHAService | null = null;
    let usedSessionName = setting.wahaSessionName;

    if (setting.wahaServer?.apiKeyEncrypted) {
      waha = WAHAService.fromEncrypted(setting.wahaServer.baseUrl, setting.wahaServer.apiKeyEncrypted || '');
    } else if (setting.wahaApiKeyEncrypted && setting.wahaBaseUrl) {
      waha = WAHAService.fromEncrypted(setting.wahaBaseUrl, setting.wahaApiKeyEncrypted || '');
    }

    if (!waha) return NextResponse.json({ error: 'No WAHA credentials' });

    const result = await waha.sendImage(usedSessionName, phone, imageUrl, 'Test Caption');
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
