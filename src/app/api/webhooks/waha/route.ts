import { NextRequest, NextResponse } from 'next/server';
import { ChatbotEngine } from '@/lib/chatbot-engine';
import { prisma } from '@/lib/prisma';
import { WAHAService } from '@/lib/waha';
import { rateLimit } from '@/lib/rate-limit';
import { requireHeaderSecret, parseJsonSafe, getRequestIp } from '@/lib/security';
import { getWahaCoreMode } from '@/lib/waha-helpers';

export const maxDuration = 60; // Set max duration to 60 seconds for Vercel Hobby tier

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
  hasMedia: boolean;
  messageId: string;
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
  
  // Cast id as any to handle WAHA's polymorphic id property (string or object)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payloadId = (messagePayload.id as any);
  const messageId = typeof payloadId === 'string' ? payloadId : (payloadId?._serialized || payloadId?.id || '');
  
  // Cast payload as any to check for hasMedia and type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mpAny = messagePayload as any;
  const hasMedia = Boolean(mpAny.hasMedia) || mpAny.type === 'image';

  return { sessionName, event, fromMe, isGroup, customerPhone, customerName, messageIn, remote, hasMedia, messageId };
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Basic rate limiting for webhook
    const ip = getRequestIp(req);
    const rl = await rateLimit(`webhook:waha:${ip}`, 60, 60 * 1000); // 60 msgs per minute
    if (!rl.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    // Security validation
    if (!requireHeaderSecret(req, 'x-webhook-secret', process.env.WAHA_WEBHOOK_SECRET)) {
      return NextResponse.json({ error: 'Unauthorized or missing secret' }, { status: 401 });
    }

    const wahaServerId = req.headers.get('x-waha-server-id');
    const coreMode = getWahaCoreMode();
    
    // Require wahaServerId if coreMode is true (multi-server enabled)
    if (coreMode && !wahaServerId) {
      return NextResponse.json({ error: 'x-waha-server-id header is required in multi-server mode' }, { status: 400 });
    }

    const body = await parseJsonSafe<WahaIncomingBody>(req, 5 * 1024 * 1024);
    if (!body) {
      return NextResponse.json({ error: 'Invalid or too large payload' }, { status: 400 });
    }
    const norm = normalizePayload(body);

    if (norm.event !== 'message') {
      return NextResponse.json({ success: true, message: 'Not a message event, ignored' });
    }

    if (
      norm.fromMe ||
      norm.remote.includes('status@broadcast') ||
      norm.customerPhone.includes('status@broadcast') ||
      norm.isGroup ||
      (!norm.messageIn && !norm.hasMedia)
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
        ...(coreMode ? { wahaServerId: wahaServerId! } : { wahaSessionName: norm.sessionName, ...(wahaServerId ? { wahaServerId } : {}) }),
        // Only fallback to userId in URL in non-production for debugging
        ...(qUserId && process.env.NODE_ENV !== 'production' ? { userId: qUserId } : {}),
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

    // Use the actual session name from DB if in core mode (since payload brings 'default')
    const actualSessionName = coreMode ? chatbotSetting.wahaSessionName! : norm.sessionName;

    // Download image if media is present
    let downloadedImageUrl: string | undefined;
    if (norm.hasMedia && norm.messageId) {
      try {
        let wahaInstance: WAHAService | null = null;
        if (chatbotSetting?.wahaServer?.apiKeyEncrypted) {
          wahaInstance = WAHAService.fromEncrypted(chatbotSetting.wahaServer.baseUrl, chatbotSetting.wahaServer.apiKeyEncrypted);
        } else if (chatbotSetting?.wahaApiKeyEncrypted && chatbotSetting?.wahaBaseUrl) {
          wahaInstance = WAHAService.fromEncrypted(chatbotSetting.wahaBaseUrl, chatbotSetting.wahaApiKeyEncrypted);
        }
        
        if (wahaInstance) {
          const b64 = await wahaInstance.downloadMediaBase64(actualSessionName, norm.messageId);
          if (b64) downloadedImageUrl = b64;
        }
      } catch (err) {
        console.error('Failed to download image from WAHA:', err);
      }
    }

    // If message is empty but has media, provide a default caption
    const finalMessageIn = (!norm.messageIn && norm.hasMedia) ? "Tolong jelaskan gambar ini berdasarkan konteks bisnis kita." : norm.messageIn;

    // Process using Chatbot Engine
    const result = await ChatbotEngine.processMessage({
      wahaServerId: chatbotSetting.wahaServerId ?? undefined,
      wahaSessionName: actualSessionName,
      customerPhone: norm.customerPhone,
      customerName: norm.customerName,
      messageIn: finalMessageIn,
      imageUrl: downloadedImageUrl,
    });

    if (result && result.reply) {

      if (chatbotSetting?.wahaServer?.apiKeyEncrypted) {
        const wahaServer = chatbotSetting.wahaServer;
        const waha = WAHAService.fromEncrypted(wahaServer.baseUrl, wahaServer.apiKeyEncrypted || '');
        await waha.sendMessage(actualSessionName, norm.customerPhone, result.reply).catch(() => {
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
