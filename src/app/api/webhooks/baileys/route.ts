import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ChatbotEngine } from '@/lib/chatbot-engine';
import { BaileysService } from '@/lib/baileys';
import {
  BaileysWebhookPayload,
  normalizeWhatsAppRecipient,
  verifyBaileysWebhook,
  webhookIdempotencyKey,
} from '@/lib/baileys-webhook';
import { getRequestIp } from '@/lib/security';
import { rateLimit } from '@/lib/rate-limit';

export const maxDuration = 60;

const MAX_WEBHOOK_BYTES = 4_000_000;

export async function POST(req: NextRequest) {
  try {
    const declaredLength = Number(req.headers.get('content-length') || 0);
    if (declaredLength > MAX_WEBHOOK_BYTES) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    const rawBody = await req.text();
    if (Buffer.byteLength(rawBody, 'utf8') > MAX_WEBHOOK_BYTES) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    const secret = process.env.BAILEYS_WEBHOOK_SECRET;
    if (secret) {
      const verified = verifyBaileysWebhook(
        rawBody,
        req.headers.get('x-webhook-timestamp'),
        req.headers.get('x-webhook-signature'),
        req.headers.get('x-webhook-secret'),
      );
      if (!verified) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    let event: BaileysWebhookPayload;
    try {
      event = JSON.parse(rawBody) as BaileysWebhookPayload;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    if (event.event !== 'message.received') {
      return NextResponse.json({ received: true, ignored: 'unsupported_event' });
    }
    if (!event.sessionId || !event.messageId || !event.from || event.isGroup) {
      return NextResponse.json({ received: true, ignored: 'invalid_or_group_message' });
    }
    if (event.from.includes('status@broadcast')) {
      return NextResponse.json({ received: true, ignored: 'status_broadcast' });
    }

    const customerPhone = normalizeWhatsAppRecipient(event.from);
    if (!customerPhone) {
      return NextResponse.json({ received: true, ignored: 'invalid_sender' });
    }

    const limit = await rateLimit(
      `webhook:baileys:${event.sessionId}:${customerPhone}:${getRequestIp(req)}`,
      20,
      60_000,
    );
    if (!limit.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const chatbot = await prisma.chatbotSetting.findFirst({
      where: {
        whatsappSessionName: event.sessionId,
        isActive: true,
      },
    });
    if (!chatbot) {
      return NextResponse.json({ received: true, ignored: 'chatbot_not_active' });
    }

    await prisma.whatsAppSession.updateMany({
      where: { userId: chatbot.userId, chatbotSettingId: chatbot.id },
      data: {
        status: 'connected',
        lastConnectedAt: new Date(),
        lastError: null,
      },
    });

    const { gateway } = await BaileysService.resolveInstance(chatbot.id);
    const incomingText = (event.text || event.caption || '').trim();
    const isImage = event.type === 'image' && Boolean(event.media?.base64);
    let imageUrl: string | undefined;
    let messageForAI = incomingText;

    if (isImage) {
      if (!chatbot.allowVision) {
        await gateway.sendMessage(
          event.sessionId,
          customerPhone,
          'Maaf, saat ini saya belum bisa melihat gambar. Silakan jelaskan melalui teks ya.',
          webhookIdempotencyKey(event.messageId, 'vision-disabled'),
        );
        return NextResponse.json({ received: true, handled: 'vision_disabled' });
      }

      imageUrl = `data:${event.media!.mimeType};base64,${event.media!.base64}`;
      if (!messageForAI) {
        messageForAI = 'Tolong jelaskan gambar ini berdasarkan konteks bisnis kita.';
      }
    }

    if (!messageForAI && !isImage) {
      return NextResponse.json({ received: true, ignored: 'empty_or_unsupported_message' });
    }

    const result = await ChatbotEngine.processMessage({
      whatsappSessionName: event.sessionId,
      customerPhone,
      customerName: event.senderName,
      messageIn: messageForAI,
      imageUrl,
    });

    if (!result) {
      return NextResponse.json({ received: true, handled: 'no_reply_required' });
    }

    let mediaDeliveryFailed = false;
    let failedReason = '';
    for (const [index, media] of (result.mediaToSend || []).entries()) {
      try {
        let imageUrl = media.url;
        // Fetch the image on Vercel and send as Base64 to bypass VPS datacenter blocks
        const imgRes = await fetch(imageUrl);
        if (!imgRes.ok) {
          throw new Error(`Failed to fetch image: HTTP ${imgRes.status}`);
        }
        
        const arrayBuffer = await imgRes.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';

        await gateway.sendImageBase64(
          event.sessionId,
          customerPhone,
          mimeType,
          base64,
          media.caption,
          webhookIdempotencyKey(event.messageId, `image-${index}`),
        );
      } catch (error) {
        mediaDeliveryFailed = true;
        failedReason = error instanceof Error ? error.message : String(error);
        console.error('Baileys image reply failed:', failedReason);
      }
    }

    if (result.reply.trim()) {
      const reply = mediaDeliveryFailed
        ? `${result.reply}\n\nMaaf, gambar belum dapat dikirim saat ini. [Debug Error: ${failedReason}]`
        : result.reply;
      await gateway.sendMessage(
        event.sessionId,
        customerPhone,
        reply,
        webhookIdempotencyKey(event.messageId, 'reply'),
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('POST /api/webhooks/baileys error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
