import { NextResponse } from 'next/server';
import { ChatbotEngine } from '@/lib/chatbot-engine';
import { prisma } from '@/lib/prisma';
import { WAHAService } from '@/lib/waha';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    // Basic rate limiting for webhook
    const ip = getClientIp(req);
    const rl = rateLimit(`webhook:waha:${ip}`, 60, 60 * 1000); // 60 msgs per minute
    if (!rl.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const body = await req.json();

    // WAHA webhook payload structure (depends on the event type)
    // For now, we assume event = message
    if (body?.event !== 'message' || !body?.payload) {
      return NextResponse.json({ success: true, message: 'Not a message event, ignored' });
    }

    const payload = body.payload;
    // Don't process our own messages or status broadcasts
    if (payload.fromMe || payload.id?.remote?.includes('status@broadcast') || payload.isGroup) {
      return NextResponse.json({ success: true, message: 'Ignored fromMe, broadcast, or group' });
    }

    const sessionName = body.session;
    const customerPhone = payload.from; // usually format 628xxx@c.us
    const customerName = payload._data?.notifyName || payload.notifyName || '';
    const messageIn = payload.body;

    if (!sessionName || !customerPhone || !messageIn) {
      return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 });
    }

    // Process using Chatbot Engine
    const reply = await ChatbotEngine.processMessage({
      wahaSessionName: sessionName,
      customerPhone,
      customerName,
      messageIn,
    });

    if (reply) {
      // Find the waha session config to send the reply back
      const chatbotSetting = await prisma.chatbotSetting.findUnique({
        where: { wahaSessionName: sessionName },
      });

      if (chatbotSetting && chatbotSetting.wahaBaseUrl && chatbotSetting.wahaApiKeyEncrypted) {
        const waha = WAHAService.fromEncrypted(
          chatbotSetting.wahaBaseUrl,
          chatbotSetting.wahaApiKeyEncrypted
        );

        // Send reply back via WAHA
        await waha.sendMessage(sessionName, customerPhone, reply).catch(err => {
          console.error('Failed to send reply via WAHA:', err);
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/webhooks/waha Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
