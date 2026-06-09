import { NextResponse } from 'next/server';
import { ChatbotEngine } from '@/lib/chatbot-engine';
import { prisma } from '@/lib/prisma';
import { WAHAService } from '@/lib/waha';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WahaMessageData {
  from?: string;
  chatId?: string;
  body?: string;
  text?: string;
  message?: string;
  fromMe?: boolean;
  isGroup?: boolean;
  notifyName?: string;
  _data?: { notifyName?: string };
  id?: { remote?: string };
}

interface WahaIncomingBody {
  session?: string;
  event?: string;
  payload?: {
    session?: string;
    event?: string;
    payload?: WahaMessageData;
    from?: string;
    chatId?: string;
    body?: string;
    text?: string;
    fromMe?: boolean;
    isGroup?: boolean;
    notifyName?: string;
    _data?: { notifyName?: string };
    id?: { remote?: string };
  };
  from?: string;
  chatId?: string;
  body?: string;
  text?: string;
  fromMe?: boolean;
  isGroup?: boolean;
  headers?: Record<string, string>;
}

interface NormalizedWahaPayload {
  sessionName: string;
  event: string;
  fromMe: boolean;
  isGroup: boolean;
  customerPhone: string;
  customerName: string;
  messageIn: string;
  remote: string;
}

// ─── Normalizer ───────────────────────────────────────────────────────────────

function normalizePayload(rawBody: WahaIncomingBody): NormalizedWahaPayload {
  const sessionName = rawBody.session || rawBody.payload?.session || '';
  const event = rawBody.event || rawBody.payload?.event || 'message';

  // Resolve nested payload
  const messagePayload: WahaMessageData =
    rawBody.payload?.payload || rawBody.payload || rawBody;

  const customerPhone =
    messagePayload.from || messagePayload.chatId || rawBody.from || rawBody.chatId || '';
  const customerName =
    messagePayload._data?.notifyName ||
    messagePayload.notifyName ||
    rawBody.payload?.notifyName ||
    '';
  const messageIn =
    messagePayload.body ||
    messagePayload.text ||
    messagePayload.message ||
    rawBody.body ||
    rawBody.text ||
    '';
  const fromMe = Boolean(messagePayload.fromMe ?? rawBody.fromMe);
  const isGroup =
    Boolean(messagePayload.isGroup ?? rawBody.isGroup) || customerPhone.endsWith('@g.us');
  const remote = messagePayload.id?.remote || rawBody.payload?.id?.remote || '';

  return { sessionName, event, fromMe, isGroup, customerPhone, customerName, messageIn, remote };
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    // Basic rate limiting for webhook
    const ip = getClientIp(req);
    const rl = await rateLimit(`webhook:waha:${ip}`, 60, 60 * 1000); // 60 msgs per minute
    if (!rl.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    // Security validation
    const webhookSecret = process.env.WAHA_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('WAHA_WEBHOOK_SECRET is not configured.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const providedSecret = req.headers.get('x-webhook-secret');
    if (providedSecret !== webhookSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const wahaServerId = req.headers.get('x-waha-server-id') || undefined;

    const body = (await req.json()) as WahaIncomingBody;
    const norm = normalizePayload(body);

    if (norm.event !== 'message') {
      return NextResponse.json({ success: true, message: 'Not a message event, ignored' });
    }

    if (
      norm.fromMe ||
      norm.remote.includes('status@broadcast') ||
      norm.customerPhone.includes('status@broadcast') ||
      norm.isGroup ||
      !norm.messageIn
    ) {
      return NextResponse.json({ success: true, message: 'Ignored fromMe, broadcast, group, or empty' });
    }

    if (!norm.sessionName || !norm.customerPhone) {
      return NextResponse.json(
        { error: 'Invalid payload structure or session name' },
        { status: 400 },
      );
    }

    const qUserId = req.nextUrl.searchParams.get('userId');

    const chatbotSetting = await prisma.chatbotSetting.findFirst({
      where: { 
        wahaSessionName: norm.sessionName,
        ...(qUserId ? { userId: qUserId } : {}),
        isActive: true,
        user: {
          subscriptions: {
            some: { status: 'active' }
          }
        }
      },
      include: { wahaServer: true },
    });

    if (!chatbotSetting) {
      return NextResponse.json({ success: true, message: 'No active chatbot setting found for this session' });
    }

    // Process using Chatbot Engine
    const result = await ChatbotEngine.processMessage({
      wahaServerId: chatbotSetting.wahaServerId,
      wahaSessionName: norm.sessionName,
      customerPhone: norm.customerPhone,
      customerName: norm.customerName,
      messageIn: norm.messageIn,
    });

    if (result && result.reply) {

      if (chatbotSetting?.wahaServer?.apiKeyEncrypted) {
        const wahaServer = chatbotSetting.wahaServer;
        const waha = WAHAService.fromEncrypted(wahaServer.baseUrl, wahaServer.apiKeyEncrypted || '');
        await waha.sendMessage(norm.sessionName, norm.customerPhone, result.reply).catch(() => {
          console.error('Failed to send reply via WAHA. Check server connection.');
        });
      } else if (chatbotSetting?.wahaApiKeyEncrypted && chatbotSetting?.wahaBaseUrl) {
        const waha = WAHAService.fromEncrypted(chatbotSetting.wahaBaseUrl, chatbotSetting.wahaApiKeyEncrypted || '');
        await waha.sendMessage(norm.sessionName, norm.customerPhone, result.reply).catch(() => {
          console.error('Failed to send reply via Legacy WAHA. Check server connection.');
        });
      } else {
        console.error(
          `WAHA reply skipped: No configured server for session=${norm.sessionName}`,
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal error';
    console.error('POST /api/webhooks/waha Error:', msg);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
