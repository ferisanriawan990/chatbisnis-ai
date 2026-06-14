import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ChatbotEngine } from '@/lib/chatbot-engine';
import { BaileysService } from '@/lib/baileys';
import { AIService } from '@/lib/ai';
import { getAICredentialCandidates } from '@/lib/ai-config';
import {
  BaileysWebhookPayload,
  normalizeWhatsAppRecipient,
  verifyBaileysWebhook,
  webhookIdempotencyKey,
} from '@/lib/baileys-webhook';
import { getRequestIp } from '@/lib/security';
import { rateLimit } from '@/lib/rate-limit';
import { secureFetchBuffer } from '@/lib/security-fetch';

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

    const envSecret = process.env.BAILEYS_WEBHOOK_SECRET;
    
    if (!envSecret) {
      console.error('CRITICAL ERROR: BAILEYS_WEBHOOK_SECRET is not configured');
      return NextResponse.json({ error: 'Webhook configuration error' }, { status: 500 });
    }

    const verified = verifyBaileysWebhook(
      rawBody,
      req.headers.get('x-webhook-timestamp'),
      req.headers.get('x-webhook-signature'),
      req.headers.get('x-webhook-secret'),
      envSecret
    );
      
    if (!verified) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
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

    let idempotencyKeyStr = `msg:${event.messageId}`;
    let isRetry = false;
    try {
      await prisma.idempotencyKey.create({
        data: { key: idempotencyKeyStr, status: 'processing' }
      });
    } catch (e: any) {
      if (e.code === 'P2002') {
        const existingKey = await prisma.idempotencyKey.findUnique({ where: { key: idempotencyKeyStr } });
        if (existingKey?.status === 'completed') {
          console.log(`Duplicate webhook rejected for completed messageId: ${event.messageId}`);
          return NextResponse.json({ received: true, ignored: 'duplicate_message_id_completed' });
        }
        // If it's failed or processing (stale), we can retry
        isRetry = true;
        await prisma.idempotencyKey.update({
          where: { key: idempotencyKeyStr },
          data: { status: 'processing' }
        });
      }
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
      include: {
        businessProfile: true,
      }
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

    const isAudioType = event.type === 'ptt' || event.type === 'audio' || event.type === 'voice';
    const hasAudioMedia = Boolean(event.media?.base64);

    if (isAudioType) {
      if (!chatbot.allowVoiceNote || !hasAudioMedia) {
        await gateway.sendMessage(
          event.sessionId,
          customerPhone,
          'Maaf, saat ini saya tidak dapat mendengarkan pesan suara (Voice Note). Silakan ketik pesan Anda dalam bentuk teks ya.',
          webhookIdempotencyKey(event.messageId, 'voice-disabled'),
        );
        return NextResponse.json({ received: true, handled: 'voice_disabled_or_missing_media' });
      }

      try {
        const credentials = await getAICredentialCandidates(chatbot);
        if (credentials.length > 0) {
          const transcribedText = await AIService.transcribeAudio(credentials[0].apiKey, event.media!.base64, event.media!.mimeType);
          messageForAI = transcribedText;
        } else {
          throw new Error('No AI credentials available for transcription');
        }
      } catch (err) {
        console.error('Transcription error:', err);
        await gateway.sendMessage(
          event.sessionId,
          customerPhone,
          'Maaf, sistem sedang kesulitan memproses pesan suara Anda. Mohon berkenan untuk mengetik pesannya ya.',
          webhookIdempotencyKey(event.messageId, 'voice-error'),
        );
        return NextResponse.json({ received: true, error: 'transcription_failed' });
      }
    }

    if (!messageForAI && !isImage && !isAudioType) {
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
        const imageUrl = media.url;
        // Fetch the image securely to bypass VPS blocks and prevent SSRF / large file OOM
        const { buffer, contentType } = await secureFetchBuffer(imageUrl, {
          maxSizeBytes: 5 * 1024 * 1024, // 5MB limit
          signal: AbortSignal.timeout(10000)
        });
        
        const base64 = buffer.toString('base64');
        
        await gateway.sendImageBase64(
          event.sessionId,
          customerPhone,
          contentType,
          base64,
          media.caption,
          webhookIdempotencyKey(event.messageId, `img-${index}`),
        );
      } catch (error) {
        mediaDeliveryFailed = true;
        failedReason = error instanceof Error ? error.message : String(error);
        console.error('Baileys image reply failed:', failedReason);
      }
    }

    if (result.reply.trim()) {
      const reply = mediaDeliveryFailed
        ? `${result.reply}\n\nMaaf, gambar belum dapat dikirim saat ini.`
        : result.reply;
      await gateway.sendMessage(
        event.sessionId,
        customerPhone,
        reply,
        webhookIdempotencyKey(event.messageId, 'reply'),
      );
    }

    // Handover Admin Alert
    if (result.metadata?.promptSource === 'handover' || result.metadata?.needsHuman) {
      if (chatbot.businessProfile?.adminPhone) {
        try {
          const adminPhoneNum = normalizeWhatsAppRecipient(chatbot.businessProfile.adminPhone);
          const alertMsg = `🚨 *NOTIFIKASI HANDOVER CHATBISNIS AI*\n\nAda pelanggan yang butuh bantuan Admin Manusia!\n\nNomor Pelanggan: wa.me/${customerPhone.split('@')[0]}\nNama: ${event.senderName || 'Tanpa Nama'}\n\nSilakan segera merespon pelanggan tersebut. AI saat ini dinonaktifkan sementara untuk nomor ini.`;
          await gateway.sendMessage(
            event.sessionId,
            adminPhoneNum,
            alertMsg,
            webhookIdempotencyKey(event.messageId, 'admin-alert'),
          );
        } catch(e) {
          console.error("Failed to send admin alert", e);
        }
      }
    }

    // Mark idempotency as completed
    await prisma.idempotencyKey.update({
      where: { key: idempotencyKeyStr },
      data: { status: 'completed' }
    });

    return NextResponse.json({ success: true, replied: !!result.reply });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    
    // Attempt to mark idempotency as failed so we can retry later
    try {
      const rawBody = await req.clone().text(); // Might fail if body already read and not cloned, but we try
      const parsed = JSON.parse(rawBody);
      if (parsed.messageId) {
        await prisma.idempotencyKey.update({
          where: { key: `msg:${parsed.messageId}` },
          data: { status: 'failed' }
        });
      }
    } catch(e) {}
    
    try {
      const errorMsg = error instanceof Error ? error.stack || error.message : String(error);
      const errorData = (error && typeof error === 'object' && 'response' in error) 
        ? ((error as any).response?.data || (error as any).response?.status || errorMsg)
        : errorMsg;
        
      const msg = typeof errorData === 'object' ? JSON.stringify(errorData) : String(errorData);
      await prisma.auditLog.create({
        data: {
          actorUserId: null,
          action: 'DEBUG_WEBHOOK_ERROR',
          entityType: 'Error',
          entityId: msg.slice(0, 50),
          metadataJson: msg,
        }
      });
    } catch (e) {}
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
