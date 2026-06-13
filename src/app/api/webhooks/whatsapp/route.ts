import { NextRequest, NextResponse } from 'next/server';
import { ChatbotEngine } from '@/lib/chatbot-engine';
import { prisma } from '@/lib/prisma';
import { WhatsappService } from '@/lib/whatsapp';
import { rateLimit } from '@/lib/rate-limit';
import { requireHeaderSecret, parseJsonSafe, getRequestIp } from '@/lib/security';
import { getWhatsappCoreMode } from '@/lib/whatsapp-helpers';

export const maxDuration = 60; // Set max duration to 60 seconds for Vercel Hobby tier

// ─── Types ────────────────────────────────────────────────────────────────────

interface WhatsappMessageData {
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

interface WhatsappIncomingBody {
  session?: string;
  event?: string;
  payload?: {
    session?: string;
    event?: string;
    payload?: WhatsappMessageData;
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

interface NormalizedWhatsappPayload {
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
  mediaUrl?: string;
}

// ─── Normalizer ───────────────────────────────────────────────────────────────

function normalizePayload(rawBody: WhatsappIncomingBody): NormalizedWhatsappPayload {
  const sessionName = rawBody.session || rawBody.payload?.session || '';
  const event = rawBody.event || rawBody.payload?.event || 'message';

  // Resolve nested payload
  const messagePayload: WhatsappMessageData =
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
  
  // Cast id as any to handle WhatsApp's polymorphic id property (string or object)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payloadId = (messagePayload.id as any);
  const messageId = typeof payloadId === 'string' ? payloadId : (payloadId?._serialized || payloadId?.id || '');
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mpAny = messagePayload as any;
  const hasMedia = 
    Boolean(mpAny.hasMedia) || 
    mpAny.type === 'image' || 
    Boolean(mpAny.message?.imageMessage) || 
    Boolean(mpAny.message?.videoMessage) ||
    Boolean(mpAny.message?.documentMessage) ||
    Boolean(mpAny.message?.audioMessage);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mediaUrl = mpAny.media?.url || (rawBody.payload as any)?.media?.url || (rawBody as any).media?.url || '';

  return { sessionName, event, fromMe, isGroup, customerPhone, customerName, messageIn, remote, hasMedia, messageId, mediaUrl };
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Security validation
    if (!requireHeaderSecret(req, 'x-webhook-secret', process.env.WHATSAPP_WEBHOOK_SECRET)) {
      return NextResponse.json({ error: 'Unauthorized or missing secret' }, { status: 401 });
    }

    const whatsappServerId = req.headers.get('x-whatsapp-server-id');
    const coreMode = getWhatsappCoreMode();
    
    // Require whatsappServerId if coreMode is true (multi-server enabled)
    if (coreMode && !whatsappServerId) {
      return NextResponse.json({ error: 'x-whatsapp-server-id header is required in multi-server mode' }, { status: 400 });
    }

    const body = await parseJsonSafe<WhatsappIncomingBody>(req, 5 * 1024 * 1024);
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

    const ip = getRequestIp(req);
    const rateLimitKey = `webhook:whatsapp:${whatsappServerId || norm.sessionName}:${norm.customerPhone}:${ip}`;
    const rl = await rateLimit(rateLimitKey, 20, 60 * 1000);
    if (!rl.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const qUserId = req.nextUrl.searchParams.get('userId');

    const chatbotSetting = await prisma.chatbotSetting.findFirst({
      where: { 
        ...(coreMode ? { whatsappServerId: whatsappServerId! } : { whatsappSessionName: norm.sessionName, ...(whatsappServerId ? { whatsappServerId } : {}) }),
        // Only fallback to userId in URL in non-production for debugging
        ...(qUserId && process.env.NODE_ENV !== 'production' ? { userId: qUserId } : {}),
        isActive: true,
        user: {
          email: { contains: '@' },
          subscriptions: {
            some: { status: 'active' }
          }
        }
      },
      include: { whatsappServer: true },
    });

    if (!chatbotSetting) {
      return NextResponse.json({ success: true, message: 'No active chatbot setting found for this session' });
    }

    // Use the actual session name from DB if in core mode (since payload brings 'default')
    const actualSessionName = coreMode ? chatbotSetting.whatsappSessionName! : norm.sessionName;

    // Instantiate WhatsApp Service for sending early replies if needed
    let whatsappInstance: WhatsappService | null = null;
    if (chatbotSetting?.whatsappServer?.apiKeyEncrypted) {
      whatsappInstance = WhatsappService.fromEncrypted(chatbotSetting.whatsappServer.baseUrl, chatbotSetting.whatsappServer.apiKeyEncrypted);
    } else if (chatbotSetting?.whatsappApiKeyEncrypted && chatbotSetting?.whatsappBaseUrl) {
      whatsappInstance = WhatsappService.fromEncrypted(chatbotSetting.whatsappBaseUrl, chatbotSetting.whatsappApiKeyEncrypted);
    }

    // Download image if media is present and vision is allowed
    let downloadedImageUrl: string | undefined;
    if (norm.hasMedia && norm.messageId && chatbotSetting.allowVision) {
      try {
        if (whatsappInstance) {
          let b64: string | null = null;
          if (norm.mediaUrl) {
            b64 = await whatsappInstance.downloadMediaByUrl(norm.mediaUrl);
          }
          if (!b64) {
            b64 = await whatsappInstance.downloadMediaBase64(actualSessionName, norm.messageId);
          }
          if (b64) downloadedImageUrl = b64;
        }
      } catch (err) {
        console.error('Failed to download image from WhatsApp:', err);
      }
    }

    let finalMessageIn = norm.messageIn;
    if (norm.hasMedia) {
      if (chatbotSetting.allowVision) {
        if (!downloadedImageUrl) {
          if (whatsappInstance) {
            await whatsappInstance.sendMessage(actualSessionName, norm.customerPhone, "Maaf, gambar belum bisa saya baca. Mohon kirim ulang gambarnya atau jelaskan lewat teks.");
          }
          return NextResponse.json({ success: true, message: 'Image download failed, notified user' });
        }
        if (!norm.messageIn) {
          finalMessageIn = "Tolong jelaskan gambar ini berdasarkan konteks bisnis kita.";
        }
      } else {
        // Stop processing and reply directly that image is not supported
        if (whatsappInstance) {
          await whatsappInstance.sendMessage(actualSessionName, norm.customerPhone, "Maaf, saat ini saya belum bisa melihat atau merespons gambar/foto. Silakan jelaskan dengan teks saja ya.");
        }
        return NextResponse.json({ success: true, message: 'Image ignored (allowVision false)' });
      }
    }

    // Process using Chatbot Engine
    const result = await ChatbotEngine.processMessage({
      whatsappServerId: chatbotSetting.whatsappServerId ?? undefined,
      whatsappSessionName: actualSessionName,
      customerPhone: norm.customerPhone,
      customerName: norm.customerName,
      messageIn: finalMessageIn,
      imageUrl: downloadedImageUrl,
    });

    if (result) {
      const { reply, mediaToSend } = result;
      let whatsapp: WhatsappService | null = null;
      let usedSessionName = actualSessionName;

      if (chatbotSetting?.whatsappServer?.apiKeyEncrypted) {
        whatsapp = WhatsappService.fromEncrypted(chatbotSetting.whatsappServer.baseUrl, chatbotSetting.whatsappServer.apiKeyEncrypted || '');
      } else if (chatbotSetting?.whatsappApiKeyEncrypted && chatbotSetting?.whatsappBaseUrl) {
        whatsapp = WhatsappService.fromEncrypted(chatbotSetting.whatsappBaseUrl, chatbotSetting.whatsappApiKeyEncrypted || '');
        usedSessionName = norm.sessionName;
      }

      if (whatsapp) {
        // 1. Send Images if any
        let mediaDeliveryFailed = false;
        let usedLinkPreviewFallback = false;
        if (mediaToSend && mediaToSend.length > 0) {
          for (const media of mediaToSend) {
            try {
              const mediaResult = await whatsapp.sendImage(usedSessionName, norm.customerPhone, media.url, media.caption, media.fallbackUrl);
              if (mediaResult.mode === 'link-preview') usedLinkPreviewFallback = true;
            } catch (err: unknown) {
              console.error('Failed to send image via WhatsApp:', err);
              mediaDeliveryFailed = true;
            }
          }
        }
        
        // 2. Send the text reply
        const linkPreviewAlreadyContainsReply = usedLinkPreviewFallback
          && result.metadata?.promptSource === 'knowledge_image';
        if (reply && reply.trim() !== '' && !linkPreviewAlreadyContainsReply) {
          const finalReplyToSend = mediaDeliveryFailed
            ? `${reply}\n\nMaaf, gambar belum dapat dikirim saat ini.`
            : reply;
          await whatsapp.sendMessage(usedSessionName, norm.customerPhone, finalReplyToSend).catch((err) => {
            console.error('Failed to send reply via WhatsApp:', err);
          });
        }
      } else {
        console.error(`WhatsApp reply skipped: No configured server for session=${norm.sessionName}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal error';
    console.error('POST /api/webhooks/whatsapp Error:', msg);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
