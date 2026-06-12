/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from './prisma';
import { AIService } from './ai';
import { getAICredentialCandidates } from './ai-config';
import { buildSystemPrompt } from './prompt-builder';
import { searchKnowledgeItems, buildKnowledgeFallbackAnswer, detectCustomerIntent } from './knowledge-search';
import { validatePublicHttpsUrl } from './security';

export interface ChatbotEngineParams {
  wahaServerId?: string;
  wahaSessionName: string;
  customerPhone: string;
  customerName?: string;
  messageIn: string;
  imageUrl?: string;
  isTest?: boolean;
}

export interface ChatbotEngineResult {
  reply: string;
  metadata?: any;
  mediaToSend?: { url: string; caption: string; fallbackUrl?: string }[];
}

function customerRequestsImage(message: string): boolean {
  return /\b(gambar|foto|image|photo|picture|pic)\b/i.test(message);
}

function isPublicImageUrl(value: string | null | undefined): value is string {
  return Boolean(value && validatePublicHttpsUrl(value));
}

function getKnowledgeShareUrl(itemId: string): string {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://chatbisnis-ai.vercel.app').replace(/\/$/, '');
  return `${appUrl}/share/knowledge/${encodeURIComponent(itemId)}`;
}

function getJakartaDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
  };
}

export class ChatbotEngine {
  static async processMessage(params: ChatbotEngineParams): Promise<ChatbotEngineResult | null> {
    const { isTest = false } = params;
    const sanitizedMessageIn = AIService.sanitizeInput(params.messageIn);
    const intent = detectCustomerIntent(sanitizedMessageIn);
    
    // 1. Load Context
    const context = await this.loadChatbotContext(params.wahaSessionName, params.wahaServerId, isTest);
    if (!context) return null; // Silent if no active bot (and not testing)

    const { chatbotSetting, botConfig, activePlan, profile } = context;

    // 2. Validate Access (Handover, Limits, Out of Hours)
    const access = await this.validateBotAccess(chatbotSetting, params.customerPhone, sanitizedMessageIn, activePlan, isTest);
    if (!access.allowed) {
      if (access.replyMessage) {
        if (!isTest) {
          await this.sendLog({ ...params, chatbotSetting, messageOut: access.replyMessage, needsHuman: access.needsHuman ?? true, intent });
        }
        return { reply: access.replyMessage, metadata: { intent, promptSource: 'handover' } };
      }
      return null;
    }

    // 3. Lead Capture
    if (activePlan?.allowLeadCapture) {
      await this.captureLead(chatbotSetting.userId, profile.id, params.customerPhone, params.customerName, sanitizedMessageIn);
    }

    // 4. n8n Bypass
    if (!isTest && activePlan?.allowN8nTemplates && chatbotSetting.n8nWebhookUrl) {
      const sent = await this.triggerN8N(chatbotSetting.n8nWebhookUrl, params.wahaSessionName, params.customerPhone, params.customerName, sanitizedMessageIn, profile.id);
      if (sent) return null; // Wait for n8n to reply
    }

    // 5. Retrieve Knowledge
    const matchedItems = await searchKnowledgeItems(sanitizedMessageIn, profile.id);
    const knowledgeMatchCount = matchedItems.length;

    // 6. Retrieve Chat History
    const chatHistoryLogs = await prisma.chatLog.findMany({
      where: {
        chatbotSettingId: chatbotSetting.id,
        customerPhone: params.customerPhone,
      },
      orderBy: { createdAt: 'desc' },
      take: (chatbotSetting as any).historyMessageCount || 6, // Menggunakan batas dinamis (Prisma)
    });
    
    // Format history: pesan user menjadi 'user', balasan AI menjadi 'assistant'
    const chatHistory: { role: string; content: string }[] = [];
    chatHistoryLogs.reverse().forEach(log => {
      if (log.messageIn) chatHistory.push({ role: 'user', content: log.messageIn });
      if (log.messageOut) chatHistory.push({ role: 'assistant', content: log.messageOut });
    });

    // 7. Build Prompt & Call AI
    const systemPrompt = this.buildPrompt(chatbotSetting, botConfig, profile, matchedItems);
    const { replyMessage, tokenUsage, usedCatalogUrl, promptSource, aiModelUsed } = await this.callAI(
      chatbotSetting,
      activePlan,
      systemPrompt,
      sanitizedMessageIn,
      chatHistory,
      params.imageUrl,
      botConfig?.catalogUrl,
    );

    // Extract image tags: [SEND_IMAGE: url | caption]
    let finalReply = replyMessage;
    const mediaToSend: { url: string; caption: string; fallbackUrl?: string }[] = [];
    const imageRegex = /\[SEND_IMAGE:\s*([^|\]]+?)(?:\s*\|\s*([^\]]+))?\]/g;
    const shouldSendImage = customerRequestsImage(sanitizedMessageIn);
    let match;
    while ((match = imageRegex.exec(finalReply)) !== null) {
      const url = match[1].trim();
      const knowledgeItem = matchedItems.find((item) => item.imageUrl === url);
      if (!shouldSendImage || !knowledgeItem || !isPublicImageUrl(url)) continue;
      mediaToSend.push({
        url,
        caption: (match[2] || '').trim(),
        fallbackUrl: getKnowledgeShareUrl(knowledgeItem.id),
      });
    }
    finalReply = finalReply.replace(imageRegex, '').replace(/\n{3,}/g, '\n\n').trim();

    // Do not rely solely on the model to emit SEND_IMAGE. If the customer
    // explicitly asks for a picture, attach images from matched KB items.
    if (shouldSendImage) {
      const knownUrls = new Set(mediaToSend.map((media) => media.url));
      for (const item of matchedItems) {
        if (!isPublicImageUrl(item.imageUrl) || knownUrls.has(item.imageUrl)) continue;
        mediaToSend.push({
          url: item.imageUrl,
          caption: item.productName ? `Gambar ${item.productName}` : 'Gambar produk',
          fallbackUrl: getKnowledgeShareUrl(item.id),
        });
        knownUrls.add(item.imageUrl);
        if (mediaToSend.length >= 3) break;
      }
    }

    let effectivePromptSource = promptSource;
    let usedDeterministicReply = false;
    if (promptSource === 'error') {
      const knowledgeFallback = buildKnowledgeFallbackAnswer(sanitizedMessageIn, matchedItems);
      if (knowledgeFallback) {
        finalReply = knowledgeFallback;
        effectivePromptSource = mediaToSend.length > 0 ? 'knowledge_image' : 'knowledge_fallback';
        usedDeterministicReply = true;
      }
    }

    // 8. Record Usage & Log
    if (!isTest) {
      await prisma.usageCounter.update({
        where: { id: access.usageId! },
        data: { aiTokens: { increment: tokenUsage }, aiChats: { increment: 1 } }
      });
      await this.sendLog({
        ...params,
        chatbotSetting,
        messageOut: finalReply,
        tokenUsage,
        intent,
        promptSource: effectivePromptSource,
        knowledgeMatchCount,
        usedCatalogUrl,
        aiUsed: aiModelUsed,
        status: effectivePromptSource === 'error' ? 'failed' : 'success',
      });
    }

    return { 
      reply: finalReply, 
      mediaToSend,
      metadata: { intent, knowledgeMatchCount, promptSource: effectivePromptSource, usedCatalogUrl, tokenUsage, usedDeterministicReply }
    };
  }

  private static async loadChatbotContext(wahaSessionName: string, wahaServerId?: string, isTest: boolean = false) {
    // Modify query to allow fallback. If serverId provided, use it. Otherwise just use session name.
    const whereClause: any = { wahaSessionName };
    if (wahaServerId) whereClause.wahaServerId = wahaServerId;
    if (!isTest) whereClause.isActive = true;

    const chatbotSetting = await prisma.chatbotSetting.findFirst({
      where: {
        ...whereClause,
        user: {
          email: { contains: '@' }
        }
      },
      include: {
        businessProfile: true,
        user: { include: { subscriptions: { include: { plan: true }, where: { status: 'active' }, take: 1 } } }
      },
    });

    if (!chatbotSetting) return null;

    const botConfig = await prisma.businessBotConfig.findUnique({
      where: { userId: chatbotSetting.userId },
      include: { template: true },
    });

    return {
      chatbotSetting,
      botConfig,
      profile: chatbotSetting.businessProfile,
      activePlan: chatbotSetting.user.subscriptions[0]?.plan
    };
  }

  private static async validateBotAccess(chatbotSetting: any, customerPhone: string, messageIn: string, activePlan: any, isTest: boolean) {
    if (isTest) return { allowed: true };

    // Handover Check
    let convoState = await prisma.conversationState.findUnique({
      where: { chatbotSettingId_customerPhone: { chatbotSettingId: chatbotSetting.id, customerPhone } }
    });

    if (!convoState) {
      convoState = await prisma.conversationState.create({
        data: { userId: chatbotSetting.userId, businessProfileId: chatbotSetting.businessProfileId, chatbotSettingId: chatbotSetting.id, customerPhone, status: 'ai_active' }
      });
    }

    if (convoState.status === 'human_handover' && convoState.handoverUntil && convoState.handoverUntil > new Date()) {
      // Allow customer to reset handover via chat
      const lowerMsg = messageIn.toLowerCase().trim();
      const resetKeywords = ['kembali ke ai', 'selesai', 'reset', 'batal', 'kembali'];
      if (resetKeywords.includes(lowerMsg)) {
        await prisma.conversationState.update({ where: { id: convoState.id }, data: { status: 'ai_active', handoverUntil: null } });
        return { allowed: false, replyMessage: "✅ Sesi dengan admin telah diakhiri. Asisten AI kembali aktif! Ada yang bisa dibantu?", needsHuman: false };
      }
      return { allowed: false };
    }

    const allowHumanHandover = activePlan ? activePlan.allowHumanHandover : false;
    if (allowHumanHandover) {
      const keywords = chatbotSetting.handoverKeywords.split(',').map((k: string) => k.trim().toLowerCase());
      const lowerMessageIn = messageIn.toLowerCase();
      if (keywords.some((k: string) => k && lowerMessageIn.includes(k))) {
        const until = new Date();
        until.setHours(until.getHours() + 24);
        await prisma.conversationState.update({ where: { id: convoState.id }, data: { status: 'human_handover', handoverUntil: until } });
        return { allowed: false, replyMessage: chatbotSetting.handoverMessage };
      }
    }

    // Out of Hours Check
    const jakartaNow = getJakartaDateParts();
    const currentMinutes = (jakartaNow.hour * 60) + jakartaNow.minute;
    const hoursStr = (chatbotSetting.businessProfile.openingHours || '08:00-17:00').toLowerCase().replace(/\s/g, '');
    if (hoursStr !== '24jam' && hoursStr !== '24/7') {
      const match = hoursStr.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
      if (match) {
        const startMinutes = (parseInt(match[1], 10) * 60) + parseInt(match[2], 10);
        const endMinutes = (parseInt(match[3], 10) * 60) + parseInt(match[4], 10);

        if (endMinutes <= startMinutes) {
          // Overnight hours, e.g. 09:00-02:00
          const isAllowed = currentMinutes >= startMinutes || currentMinutes < endMinutes;
          if (!isAllowed) return { allowed: false, replyMessage: chatbotSetting.outOfHoursMessage };
        } else {
          // Normal hours, e.g. 08:00-17:00
          if (currentMinutes < startMinutes || currentMinutes >= endMinutes) {
            return { allowed: false, replyMessage: chatbotSetting.outOfHoursMessage };
          }
        }
      }
    }

    // Usage Limits
    const today = new Date(Date.UTC(jakartaNow.year, jakartaNow.month - 1, jakartaNow.day));
    const monthStr = `${jakartaNow.year}-${jakartaNow.month.toString().padStart(2, '0')}`;
    const maxDaily = activePlan?.dailyChatLimit || chatbotSetting.dailyChatLimit;
    const maxMonthly = activePlan?.monthlyChatLimit || chatbotSetting.monthlyChatLimit;

    const usageResult = await prisma.$transaction(async (tx) => {
      let usage = await tx.usageCounter.findUnique({
        where: { userId_date: { userId: chatbotSetting.userId, date: today } }
      });
      if (!usage) {
        usage = await tx.usageCounter.create({
          data: { userId: chatbotSetting.userId, businessProfileId: chatbotSetting.businessProfileId, date: today, month: monthStr }
        });
      }

      const monthlyData = await tx.usageCounter.aggregate({ _sum: { aiChats: true }, where: { userId: chatbotSetting.userId, month: monthStr } });
      const monthlyCount = monthlyData._sum.aiChats || 0;
      
      if (usage.aiChats >= maxDaily || monthlyCount >= maxMonthly) return { allowed: false, usage };
      
      const updatedUsage = await tx.usageCounter.update({ where: { id: usage.id }, data: { whatsappMessages: { increment: 1 } } });
      return { allowed: true, usage: updatedUsage };
    });

    if (!usageResult.allowed) {
      return { allowed: false, replyMessage: chatbotSetting.fallbackMessage };
    }

    return { allowed: true, usageId: usageResult.usage.id };
  }

  private static async captureLead(userId: string, businessProfileId: string, customerPhone: string, customerName: string | undefined, messageIn: string) {
    const leadKeywords = ['pesan', 'order', 'beli', 'harga', 'mau', 'tertarik'];
    if (leadKeywords.some(k => messageIn.toLowerCase().includes(k))) {
      await prisma.lead.upsert({
        where: { businessProfileId_customerPhone: { businessProfileId, customerPhone } },
        update: { customerName: customerName || undefined, updatedAt: new Date() },
        create: { userId, businessProfileId, customerPhone, customerName, status: 'cold' }
      });
    }
  }

  private static async triggerN8N(url: string, sessionName: string, customerPhone: string, customerName: string | undefined, messageIn: string, businessProfileId: string) {
    try {
      const { N8NService } = await import('./n8n');
      await N8NService.sendWebhook(url, { sessionName, customerPhone, customerName: customerName || '', messageIn, businessProfileId });
      return true;
    } catch {
      return false;
    }
  }

  private static buildPrompt(chatbotSetting: any, botConfig: any, profile: any, matchedItems: any[]) {
    let relevantKnowledge = '';
    let charCount = 0;
    const limit = chatbotSetting.knowledgeCharLimit || 3500;
    for (const item of matchedItems) {
      if (charCount > limit) break;
      let text = `- ${item.searchableText}`;
      if (item.imageUrl) text += `\n  URL Gambar Tersedia: ${item.imageUrl}`;
      text += '\n';
      relevantKnowledge += text;
      charCount += text.length;
    }

    let customFAQ: Array<{ q: string; a: string }> = [];
    if (botConfig && botConfig.customFAQ) {
      try { customFAQ = JSON.parse(botConfig.customFAQ || '[]'); } catch { /* ignore */ }
    }
    
    return buildSystemPrompt({
      templatePrompt: (botConfig?.template?.systemPrompt) || '',
      businessData: {
        businessName: botConfig?.businessName || profile.businessName,
        businessDescription: botConfig?.businessDescription || profile.businessDescription,
        productsOrServices: botConfig?.productsOrServices,
        pricingInfo: botConfig?.pricingInfo,
        operationalHours: botConfig?.operationalHours || profile.openingHours,
        address: botConfig?.address || profile.address,
        serviceArea: botConfig?.serviceArea,
        paymentMethods: botConfig?.paymentMethods,
        deliveryMethods: botConfig?.deliveryMethods,
        humanAdminContact: botConfig?.humanAdminContact || profile.adminPhone,
        catalogUrl: botConfig?.catalogUrl,
        mapsUrl: botConfig?.mapsUrl,
        websiteUrl: profile.websiteUrl,
        instagramUrl: profile.instagramUrl,
        marketplaceUrl: profile.marketplaceUrl,
      },
      customFAQ,
      tone: chatbotSetting.toneStyle || botConfig?.tone || 'Profesional',
      languageStyle: chatbotSetting.language || botConfig?.languageStyle || 'id',
      botMode: botConfig?.botMode || 'auto_reply',
      relevantKnowledge,
      botName: chatbotSetting.botName || 'AI Assistant',
      useEmoji: chatbotSetting.useEmoji ?? true,
      fallbackMessage: chatbotSetting.fallbackMessage || 'Mohon maaf, saya tidak mengerti.',
      maxReplyLength: chatbotSetting.maxReplyLength || 'sedang',
    });
  }

  private static async callAI(
    chatbotSetting: any,
    activePlan: any,
    systemPrompt: string,
    messageIn: string,
    chatHistory: { role: string; content: string }[] = [],
    imageUrl?: string,
    catalogUrl?: string | null,
  ) {
    const defaultModel = chatbotSetting.aiModel || 'gpt-4o-mini';
    const credentials = await getAICredentialCandidates(
      chatbotSetting,
      activePlan?.allowCustomApiKey === true,
    );

    if (credentials.length === 0) {
      return { replyMessage: chatbotSetting.fallbackMessage, tokenUsage: 0, usedCatalogUrl: false, promptSource: 'error', aiModelUsed: defaultModel };
    }

    const allowSelling = chatbotSetting.allowSelling ?? false;
    const allowPromoOffer = chatbotSetting.allowPromoOffer ?? false;
    
    let finalSystemPrompt = systemPrompt;
    if (!allowSelling) {
      finalSystemPrompt += '\n\nDILARANG keras melakukan hard-selling. Berikan informasi saja.';
    }
    if (!allowPromoOffer) {
      finalSystemPrompt += '\n\nDILARANG keras memberikan promosi, diskon, atau janji penawaran yang tidak tertulis eksplisit.';
    }
    const actionWebhookUrl = validatePublicHttpsUrl(chatbotSetting.actionWebhookUrl || '')
      ? chatbotSetting.actionWebhookUrl
      : null;
    if (actionWebhookUrl) {
      finalSystemPrompt += `\n\nAKSI EKSTERNAL:\nJika kamu butuh mengecek data dinamis ke sistem pihak ketiga (seperti cek stok real-time, buat invoice, dll), balas pesan ini HANYA dengan output JSON berformat: {"tool_call": true, "action": "nama_aksi", "params": {"key": "value"}}. Jangan tambahkan teks lain. Sistem akan memproses dan mengembalikan data kepadamu.`;
    }
    
    finalSystemPrompt += `\n\nPENGIRIMAN GAMBAR PRODUK (SANGAT PENTING):
Hanya jika pengguna secara eksplisit meminta gambar/foto produk yang memiliki data "URL Gambar Tersedia", KAMU WAJIB MENYELIPKAN TAG GAMBAR INI di akhir atau di tengah balasanmu:
[SEND_IMAGE: <url_gambar> | <caption_singkat>]
CONTOH BENAR: [SEND_IMAGE: https://imgur.com/xyz.jpg | Ini adalah gambar sepatu]
JANGAN mengirim tag gambar untuk pertanyaan harga, stok, atau detail biasa jika pengguna tidak meminta gambar. JANGAN gunakan format markdown seperti ![gambar](url). WAJIB gunakan format kurung siku [SEND_IMAGE: url | caption] persis seperti contoh.`;

    try {
      const maxTokens = chatbotSetting.maxReplyLength === 'pendek' ? 150 : chatbotSetting.maxReplyLength === 'panjang' ? 800 : 450;
      const generateWithCredential = (
        credential: (typeof credentials)[number],
        userMessage: string,
        history = chatHistory,
        requestImageUrl?: string,
      ) => AIService.generateReply({
        systemPrompt: finalSystemPrompt,
        userMessage,
        imageUrl: requestImageUrl,
        chatHistory: history,
        provider: credential.provider,
        model: credential.model,
        apiKey: credential.apiKey,
        maxTokens,
      });

      let activeCredential = credentials[0];
      let aiResult = null;
      for (let index = 0; index < credentials.length; index += 1) {
        activeCredential = credentials[index];
        try {
          // If vision is not allowed, strip the image URL so the AI only gets text
          const effectiveImageUrl = chatbotSetting.allowVision ? imageUrl : undefined;
          aiResult = await generateWithCredential(activeCredential, messageIn, chatHistory, effectiveImageUrl);
          break;
        } catch (error) {
          const hasNextCredential = index < credentials.length - 1;
          if (!AIService.isRetryableError(error) || !hasNextCredential) throw error;
          console.warn(`AI credential source "${activeCredential.source}" was rejected; trying the next configured credential.`);
        }
      }

      if (!aiResult) throw new Error('Tidak ada credential AI yang dapat digunakan.');

      let finalReply = aiResult.reply;
      let totalTokens = aiResult.tokenUsage || 0;

      // Tool Call Execution Loop
      if (actionWebhookUrl && finalReply.includes('"tool_call":')) {
        try {
          const jsonMatch = finalReply.match(/\{[\s\S]*"tool_call"[\s\S]*\}/);
          if (jsonMatch) {
            const toolData = JSON.parse(jsonMatch[0]);
            if (toolData.tool_call === true) {
              const webhookRes = await fetch(actionWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: toolData.action, params: toolData.params, customerMessage: messageIn }),
                signal: AbortSignal.timeout(15000),
              });
              let webhookResultString = 'Gagal memanggil sistem eksternal.';
              if (webhookRes.ok) {
                webhookResultString = (await webhookRes.text()).slice(0, 20000);
              }

              const updatedHistory = [...chatHistory, { role: 'user', content: messageIn }, { role: 'assistant', content: finalReply }];
              const followUpUserMsg = `[SYSTEM RESPONSE FROM ACTION ${toolData.action}]:\n${webhookResultString}\n\nBerikan jawaban akhir kepada pelanggan berdasarkan data tersebut.`;

              const followUpResult = await generateWithCredential(activeCredential, followUpUserMsg, updatedHistory, undefined);

              finalReply = followUpResult.reply;
              totalTokens += followUpResult.tokenUsage || 0;
            }
          }
        } catch (e) {
          console.error("Tool call error", e);
        }
      }

      return {
        replyMessage: finalReply,
        tokenUsage: totalTokens,
        usedCatalogUrl: Boolean(catalogUrl && finalReply.includes(catalogUrl)),
        promptSource: 'ai',
        aiModelUsed: activeCredential.model,
      };
    } catch (error: unknown) {
      console.error('AI Error:', error);
      return { replyMessage: chatbotSetting.fallbackMessage, tokenUsage: 0, usedCatalogUrl: false, promptSource: 'error', aiModelUsed: credentials[0].model };
    }
  }


  private static async sendLog(params: any) {
    try {
      await prisma.chatLog.create({
        data: {
          userId: params.chatbotSetting.userId,
          businessProfileId: params.chatbotSetting.businessProfileId,
          chatbotSettingId: params.chatbotSetting.id,
          customerPhone: params.customerPhone,
          customerName: params.customerName || '',
          messageIn: params.messageIn,
          messageOut: params.messageOut,
          status: params.status || 'success',
          errorMessage: params.status === 'failed' ? 'AI provider unavailable and no knowledge fallback matched.' : null,
          needsHuman: params.needsHuman || false,
          tokenUsage: params.tokenUsage || 0,
          aiUsed: params.aiUsed || params.chatbotSetting.aiModel || 'unknown',
          intent: params.intent,
          metadataJson: JSON.stringify({
            intent: params.intent,
            promptSource: params.promptSource,
            knowledgeMatchCount: params.knowledgeMatchCount,
            usedCatalogUrl: params.usedCatalogUrl
          }),
        }
      });
    } catch (error) {
      console.error("Failed to insert ChatLog:", error);
    }
  }
}
