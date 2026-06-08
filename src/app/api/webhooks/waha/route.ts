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

    // Security validation
    const webhookSecret = process.env.WAHA_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('WAHA_WEBHOOK_SECRET is not configured in production environment.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const providedSecret = req.headers.get('x-webhook-secret');
    if (providedSecret !== webhookSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Helper to safely extract WAHA payload
    const getNormalizedPayload = (rawBody: unknown) => {
      const b = rawBody as any;
      const sessionName = b?.session || b?.payload?.session || '';
      const event = b?.event || b?.payload?.event || 'message';
      const messagePayload = b?.payload?.payload || b?.payload || b;
      
      const customerPhone = messagePayload?.from || messagePayload?.chatId || '';
      const customerName = messagePayload?._data?.notifyName || messagePayload?.notifyName || '';
      const messageIn = messagePayload?.body || messagePayload?.text || messagePayload?.message || '';
      const fromMe = Boolean(messagePayload?.fromMe);
      const isGroup = Boolean(messagePayload?.isGroup) || customerPhone.endsWith('@g.us');
      const remote = messagePayload?.id?.remote || '';
      
      const headers = b?.headers as Record<string, string> || {};
      
      return {
        sessionName,
        event,
        fromMe,
        isGroup,
        customerPhone,
        customerName,
        messageIn,
        remote,
        webhookSecret: headers['x-webhook-secret'] || ''
      };
    };

    const norm = getNormalizedPayload(body);

    if (norm.event !== 'message') {
      return NextResponse.json({ success: true, message: 'Not a message event, ignored' });
    }

    if (norm.fromMe || norm.remote.includes('status@broadcast') || norm.isGroup || !norm.messageIn) {
      return NextResponse.json({ success: true, message: 'Ignored fromMe, broadcast, group, or empty' });
    }

    if (!norm.sessionName || norm.sessionName === 'default' || !norm.customerPhone) {
      return NextResponse.json({ error: 'Invalid payload structure or session name' }, { status: 400 });
    }

    // Process using Chatbot Engine
    const reply = await ChatbotEngine.processMessage({
      wahaSessionName: norm.sessionName,
      customerPhone: norm.customerPhone,
      customerName: norm.customerName,
      messageIn: norm.messageIn,
    });

    if (reply) {
      // Find the waha session config to send the reply back
      const chatbotSetting = await prisma.chatbotSetting.findUnique({
        where: { wahaSessionName: norm.sessionName },
      });

      if (chatbotSetting && chatbotSetting.wahaBaseUrl && chatbotSetting.wahaApiKeyEncrypted) {
        const waha = WAHAService.fromEncrypted(
          chatbotSetting.wahaBaseUrl,
          chatbotSetting.wahaApiKeyEncrypted
        );

        // Send reply back via WAHA
        await waha.sendMessage(norm.sessionName, norm.customerPhone, reply).catch(() => {
          // Do not log full err response which might contain decrypted tokens
          console.error('Failed to send reply via WAHA. Check connection.');
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Only log standard error message, not full object which could leak secrets
    console.error('POST /api/webhooks/waha Error:', (error as Error).message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
