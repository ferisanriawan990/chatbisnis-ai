/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from './prisma';
import { AIService } from './ai';

import { LeadExtractor } from './lead-extractor';
import { getAICredentialCandidates } from './ai-config';
import { buildSystemPrompt } from './prompt-builder';
import { searchKnowledgeItems, buildKnowledgeFallbackAnswer, detectCustomerIntent } from './knowledge-search';
import { validatePublicHttpsUrl } from './security';
import { analyzeSentiment, SentimentResult } from './sentiment-analysis';

export interface ChatbotEngineParams {
  whatsappServerId?: string;
  whatsappSessionName: string;
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
    const sentiment = analyzeSentiment(sanitizedMessageIn);
    
    // 1. Load Context
    const context = await this.loadChatbotContext(params.whatsappSessionName, params.whatsappServerId, isTest);
    if (!context) return null; // Silent if no active bot (and not testing)

    const { chatbotSetting, botConfig, activePlan, profile } = context;

    // 2. Validate Access (Handover, Limits, Out of Hours)
    const access = await this.validateBotAccess(chatbotSetting, params.customerPhone, sanitizedMessageIn, activePlan, isTest, sentiment, params.customerName);
    if (!access.allowed) {
      if (access.replyMessage) {
        if (!isTest) {
          await this.sendLog({ ...params, chatbotSetting, messageOut: access.replyMessage, needsHuman: access.needsHuman ?? true, intent, sentiment });
        }
        return { reply: access.replyMessage, metadata: { intent, promptSource: 'handover' } };
      }
      return null;
    }

    // 3. Lead Capture is now handled asynchronously below

    // 4. (N8N Bypass Removed)

    // 5. Retrieve Knowledge
    let matchedItems = await searchKnowledgeItems(sanitizedMessageIn, profile.id);
    
    const shouldSendImage = customerRequestsImage(sanitizedMessageIn);

    // Jika ada gambar namun tidak ada kecocokan text, atau user meminta gambar secara generik,
    // berikan konteks beberapa produk agar AI bisa mencocokkan visual gambar dengan deskripsi produk di database.
    if ((params.imageUrl || shouldSendImage) && matchedItems.length === 0) {
      matchedItems = await prisma.knowledgeItem.findMany({
        where: { businessProfileId: profile.id, isActive: true },
        take: 15,
      });
    }

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

    // 6.5 Run AI Lead Extraction in Background (non-blocking)
    if (activePlan?.allowLeadCapture) {
      getAICredentialCandidates(chatbotSetting).then(credentials => {
        if (credentials.length > 0) {
          this.captureLeadWithAI(
            chatbotSetting.userId,
            profile.id,
            params.customerPhone,
            sanitizedMessageIn,
            chatHistory,
            credentials[0].apiKey,
            credentials[0].model
          ).catch(e => console.error("Lead extraction error:", e));
        }
      });
    }

    // 6.7 Fetch Products & Cart & Lead
    const products = await prisma.product.findMany({
      where: { businessProfileId: profile.id, isAvailable: true }
    });

    const existingLead = await prisma.lead.findUnique({
      where: { businessProfileId_customerPhone: { businessProfileId: profile.id, customerPhone: params.customerPhone } }
    });

    const activeCart = await prisma.order.findFirst({
      where: { businessProfileId: profile.id, customerPhone: params.customerPhone, status: 'draft' },
      include: { items: true }
    });

    // 7. Build Prompt & Call AI
    const systemPrompt = this.buildPrompt(chatbotSetting, botConfig, profile, matchedItems, products, existingLead, activeCart);
    const { replyMessage, tokenUsage, usedCatalogUrl, promptSource, aiModelUsed } = await this.callAI(
      chatbotSetting,
      activePlan,
      systemPrompt,
      sanitizedMessageIn,
      chatHistory,
      params.imageUrl,
      botConfig?.catalogUrl,
      profile.id,
      params.customerPhone,
      params.customerName
    );

    // Extract image tags: [SEND_IMAGE: url | caption]
    let finalReply = replyMessage;
    const mediaToSend: { url: string; caption: string; fallbackUrl?: string }[] = [];
    const imageRegex = /\[SEND_IMAGE:\s*([^|\]]+?)(?:\s*\|\s*([^\]]+))?\]/g;
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
        sentiment,
      });
    }

    return { 
      reply: finalReply, 
      mediaToSend,
      metadata: { intent, knowledgeMatchCount, promptSource: effectivePromptSource, usedCatalogUrl, tokenUsage, usedDeterministicReply }
    };
  }

  private static async loadChatbotContext(whatsappSessionName: string, whatsappServerId?: string, isTest: boolean = false) {
    // Modify query to allow fallback. If serverId provided, use it. Otherwise just use session name.
    const whereClause: any = { whatsappSessionName };
    if (whatsappServerId) whereClause.whatsappServerId = whatsappServerId;
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

  private static async validateBotAccess(chatbotSetting: any, customerPhone: string, messageIn: string, activePlan: any, isTest: boolean, sentiment: SentimentResult, customerName?: string) {
    if (isTest) return { allowed: true };

    // Handover Check & Inbox Update
    let convoState = await prisma.conversationState.findUnique({
      where: { chatbotSettingId_customerPhone: { chatbotSettingId: chatbotSetting.id, customerPhone } }
    });

    const previousLastMessageAt = convoState?.lastMessageAt || new Date(0);

    if (!convoState) {
      convoState = await prisma.conversationState.create({
        data: { 
          userId: chatbotSetting.userId, 
          businessProfileId: chatbotSetting.businessProfileId, 
          chatbotSettingId: chatbotSetting.id, 
          customerPhone, 
          customerName,
          status: 'ai_active',
          unreadCount: 1,
          lastMessageAt: new Date(),
          sentimentScore: sentiment
        }
      });
    } else {
      // Update Inbox Unread Count and Last Message
      convoState = await prisma.conversationState.update({
        where: { id: convoState.id },
        data: {
          unreadCount: { increment: 1 },
          lastMessageAt: new Date(),
          sentimentScore: sentiment,
          customerName: customerName || convoState.customerName
        }
      });
    }

    const ONE_HOUR = 60 * 60 * 1000;
    const isStale = (new Date().getTime() - new Date(previousLastMessageAt).getTime()) > ONE_HOUR;

    if (convoState.status === 'human_handover' || convoState.status === 'waiting_admin') {
      // Auto-return to AI if stale (Admin didn't reply or conversation went cold for > 1 hour)
      if (isStale) {
        await prisma.conversationState.update({ 
          where: { id: convoState.id }, 
          data: { status: 'ai_active', handoverUntil: null } 
        });
        // Let it fall through so AI can reply to the new message that just broke the silence
      } else if (convoState.handoverUntil && convoState.handoverUntil > new Date()) {
        // Allow customer to reset handover via chat
        const lowerMsg = messageIn.toLowerCase().trim();
        const resetKeywords = ['kembali ke ai', 'selesai', 'reset', 'batal', 'kembali'];
        if (resetKeywords.includes(lowerMsg)) {
          await prisma.conversationState.update({ where: { id: convoState.id }, data: { status: 'ai_active', handoverUntil: null } });
          return { allowed: false, replyMessage: "✅ Sesi dengan admin telah diakhiri. Asisten AI kembali aktif! Ada yang bisa dibantu?", needsHuman: false };
        }
        return { allowed: false }; // Silently ignore other messages because admin is handling it
      }
    }

    const allowHumanHandover = activePlan ? activePlan.allowHumanHandover : false;
    if (allowHumanHandover) {
      const keywords = chatbotSetting.handoverKeywords.split(',').map((k: string) => k.trim().toLowerCase());
      const lowerMessageIn = messageIn.toLowerCase();
      if (keywords.some((k: string) => k && lowerMessageIn.includes(k)) || sentiment === 'marah') {
        const until = new Date();
        until.setHours(until.getHours() + 24);
        await prisma.conversationState.update({ where: { id: convoState.id }, data: { status: 'waiting_admin', handoverUntil: until } });
        
        // Generate Smart Summary Asynchronously
        (async () => {
          try {
            const credentials = await getAICredentialCandidates(chatbotSetting);
            if (credentials.length > 0) {
              const recentLogs = await prisma.chatLog.findMany({
                where: { chatbotSettingId: chatbotSetting.id, customerPhone },
                orderBy: { createdAt: 'desc' },
                take: 5
              });
              const historyText = recentLogs.reverse().map((l: any) => `${l.messageIn ? 'user' : 'assistant'}: ${l.messageIn || l.messageOut}`).join('\n');
              const summaryPrompt = "Rangkum percakapan berikut dalam 1-2 kalimat pendek untuk memberi tahu agen CS manusia apa masalah atau inti percakapan pelanggan saat ini. Hanya keluarkan ringkasan teks tanpa pembuka/penutup.\n\nRiwayat:\n" + historyText + `\nuser: ${messageIn}`;
              const res = await AIService.generateReply({
                systemPrompt: "Kamu adalah asisten ringkasan yang objektif, fokus, dan sangat singkat.",
                userMessage: summaryPrompt,
                provider: credentials[0].provider,
                model: credentials[0].model,
                apiKey: credentials[0].apiKey,
                maxTokens: 100
              });
              if (res && res.reply) {
                await prisma.conversationState.update({ where: { id: convoState.id }, data: { summary: res.reply } });
              }
            }
          } catch (e) {
            console.error('Failed to generate smart summary via keyword', e);
          }
        })();

        return { allowed: false, replyMessage: chatbotSetting.handoverMessage, needsHuman: true };
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

  private static async captureLeadWithAI(
    userId: string,
    businessProfileId: string,
    customerPhone: string,
    messageIn: string,
    chatHistory: { role: string; content: string }[],
    apiKey: string,
    model: string
  ) {
    const leadKeywords = ['pesan', 'order', 'beli', 'harga', 'mau', 'tertarik', 'tanya', 'minat', 'alamat', 'ukuran'];
    if (!leadKeywords.some(k => messageIn.toLowerCase().includes(k))) return;

    try {
      const extracted = await LeadExtractor.extract(chatHistory, messageIn, apiKey, model);
      if (extracted && extracted.isLead) {
        
        let tagsStr: string | undefined = undefined;
        if (extracted.tags && Array.isArray(extracted.tags) && extracted.tags.length > 0) {
          tagsStr = extracted.tags.join(',');
        }

        await prisma.lead.upsert({
          where: { businessProfileId_customerPhone: { businessProfileId, customerPhone } },
          update: {
            customerName: extracted.customerName || undefined,
            interest: extracted.interest || undefined,
            budget: extracted.budget || undefined,
            address: extracted.address || undefined,
            status: extracted.status,
            notes: extracted.notes || undefined,
            tags: tagsStr || undefined,
            leadScore: extracted.leadScore || undefined,
            churnReason: extracted.churnReason || undefined,
            updatedAt: new Date()
          },
          create: {
            userId,
            businessProfileId,
            customerPhone,
            customerName: extracted.customerName || 'Pelanggan Baru',
            interest: extracted.interest,
            budget: extracted.budget,
            address: extracted.address,
            status: extracted.status,
            notes: extracted.notes,
            tags: tagsStr,
            leadScore: extracted.leadScore,
            churnReason: extracted.churnReason
          }
        });
      }
    } catch (e) {
      console.error('Lead AI Extraction Error', e);
    }
  }



  private static buildPrompt(
    chatbotSetting: any,
    botConfig: any,
    profile: any,
    matchedItems: any[],
    products?: any[],
    existingLead?: any,
    activeCart?: any
  ): string {
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

    if (products && products.length > 0) {
      let productText = '\n[KATALOG PRODUK & STOK]\nBerikut adalah daftar produk beserta ID, harga, dan stok. Gunakan ID produk jika ingin menambahkannya ke keranjang:\n';
      products.forEach((p, i) => {
        productText += `- [ID: ${p.id}] ${p.name} (Kategori: ${p.category || '-'}) | Harga: Rp ${p.price} | Stok: ${p.stock}\n`;
      });
      relevantKnowledge += productText;
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
        customLinks: profile.customLinks ? JSON.parse(profile.customLinks) : null,
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
      customerName: existingLead?.customerName,
      isReturning: Boolean(existingLead),
      cartItems: activeCart?.items,
      cartTotal: activeCart?.totalAmount,
      allowSelling: chatbotSetting.allowSelling ?? true,
      allowPromoOffer: chatbotSetting.allowPromoOffer ?? true,
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
    businessProfileId?: string,
    customerPhone?: string,
    customerName?: string
  ) {
    const defaultModel = chatbotSetting.aiModel || 'gemini-2.5-flash-lite';
    const credentials = await getAICredentialCandidates(chatbotSetting);

    if (credentials.length === 0) {
      return { replyMessage: chatbotSetting.fallbackMessage, tokenUsage: 0, usedCatalogUrl: false, promptSource: 'error', aiModelUsed: defaultModel };
    }

    let finalSystemPrompt = systemPrompt;

    const actionWebhookUrl = validatePublicHttpsUrl(chatbotSetting.actionWebhookUrl || '')
      ? chatbotSetting.actionWebhookUrl
      : null;

    finalSystemPrompt += `\nSTRATEGI CLOSING & ANTI-CHURN:
Jika pelanggan menunjukkan ketertarikan tinggi tetapi mengeluhkan "Harga terlalu mahal", "Ongkirnya mahal", atau membandingkan dengan toko lain, KAMU DIIZINKAN untuk memberikan penawaran khusus (Diskon Darurat) untuk menutup penjualan:
- Tawarkan "Diskon Spesial 10%" atau "Potongan Ongkir Rp 10.000" sebagai tawaran eksklusif.
- Katakan bahwa penawaran ini hanya berlaku hari ini.
Jangan tawarkan diskon jika pelanggan tidak mengeluh tentang harga!

Kamu MEMILIKI native tool_call berikut:
- {"tool_call": true, "action": "add_to_cart", "params": {"productId": "<ID>", "quantity": 1}} : Untuk memasukkan barang ke keranjang pembeli.
- {"tool_call": true, "action": "calculate_shipping", "params": {"address": "alamat lengkap", "deliveryMethod": "shipping atau pickup"}} : PANGGIL INI sebelum melakukan checkout untuk menghitung total dengan ongkir. Tanyakan dulu apakah mereka ingin pesanan Dikirim (shipping) atau Diambil di Toko (pickup) beserta alamat jika belum ada.
- {"tool_call": true, "action": "checkout"} : Untuk memproses keranjang menjadi pesanan Pending. PASTIKAN sudah menghitung ongkir dulu menggunakan calculate_shipping.
- {"tool_call": true, "action": "verify_payment"} : PANGGIL INI JIKA pelanggan baru saja mengirimkan FOTO BUKTI TRANSFER dan kamu bisa memvalidasi bahwa foto tersebut memang bukti transfer.
- {"tool_call": true, "action": "check_availability", "params": {"date": "YYYY-MM-DD", "hour": "HH:00"}} : Cek apakah slot jam tersebut kosong untuk layanan.
- {"tool_call": true, "action": "create_booking", "params": {"date": "YYYY-MM-DD", "hour": "HH:00", "serviceName": "Nama Layanan"}} : Buat reservasi / booking ke dalam sistem jika slot kosong.
- {"tool_call": true, "action": "record_testimonial", "params": {"rating": 5, "review": "Teks ulasan..."}} : PANGGIL INI otomatis jika pelanggan memberikan balasan rating angka (1-5) beserta komentarnya, sebagai umpan balik pasca-pembelian.
- {"tool_call": true, "action": "request_human"} : PANGGIL INI JIKA pelanggan benar-benar kebingungan, marah, atau meminta eksplisit berbicara dengan admin/manusia/agen, dan kamu tidak bisa menyelesaikannya.

Sistem akan langsung memproses JSON tersebut dan memberimu hasil.`;

    if (actionWebhookUrl) {
      finalSystemPrompt += `\nJika kamu butuh memanggil sistem luar (webhook): {"tool_call": true, "action": "webhook", "params": {"key": "value"}}.`;
    }
    
    finalSystemPrompt += `\n\nPENGIRIMAN GAMBAR PRODUK:
Hanya jika pengguna secara eksplisit meminta gambar/foto produk yang memiliki data "URL Gambar Tersedia", KAMU WAJIB MENYELIPKAN TAG GAMBAR INI di balasanmu:
[SEND_IMAGE: <url_gambar> | <caption_singkat>]
CONTOH BENAR: [SEND_IMAGE: https://imgur.com/xyz.jpg | Ini adalah gambar sepatu]`;

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
      if (finalReply.includes('"tool_call":')) {
        try {
          const jsonMatch = finalReply.match(/\{[\s\S]*"tool_call"[\s\S]*\}/);
          if (jsonMatch) {
            const toolData = JSON.parse(jsonMatch[0]);
            if (toolData.tool_call === true) {
              let toolResultString = 'Aksi tidak diketahui atau gagal.';

              if (toolData.action === 'add_to_cart' && businessProfileId && customerPhone) {
                const quantity = Math.max(1, Math.min(Number(toolData.params.quantity) || 1, 100)); // Limit 1-100
                const product = await prisma.product.findUnique({ 
                  where: { id: toolData.params.productId, businessProfileId } 
                });
                if (product) {
                  let order = await prisma.order.findFirst({ where: { businessProfileId, customerPhone, status: 'draft' } });
                  if (!order) {
                    order = await prisma.order.create({
                      data: { businessProfileId, customerPhone, customerName: customerName || 'Customer', orderNumber: 'ORD-' + Date.now() }
                    });
                  }
                  await prisma.orderItem.create({
                    data: { orderId: order.id, productId: product.id, productName: product.name, quantity, price: product.price }
                  });
                  // Recalculate total
                  const items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
                  const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
                  await prisma.order.update({ where: { id: order.id }, data: { totalAmount: total } });
                  toolResultString = `Berhasil ditambahkan ke keranjang. Total keranjang saat ini: Rp ${total}. Berikan konfirmasi santai ke pelanggan.`;
                } else {
                  toolResultString = 'Gagal: Produk tidak ditemukan.';
                }
              } else if (toolData.action === 'calculate_shipping' && businessProfileId && customerPhone) {
                const method = toolData.params.deliveryMethod === 'pickup' ? 'pickup' : 'shipping';
                let fee = 0;
                let replyFee = "Gratis karena pesanan diambil di toko.";
                
                if (method === 'shipping') {
                  const addr = (toolData.params.address || '').toLowerCase();
                  if (addr.includes('jakarta')) fee = 15000;
                  else if (addr.includes('jawa')) fee = 25000;
                  else if (addr.includes('sumatera')) fee = 40000;
                  else if (addr.includes('kalimantan')) fee = 50000;
                  else if (addr.includes('sulawesi')) fee = 60000;
                  else if (addr.includes('papua')) fee = 100000;
                  else fee = 20000; // default tarif flat simulasi
                  replyFee = `Rp ${fee}`;
                }

                const order = await prisma.order.findFirst({ where: { businessProfileId, customerPhone, status: 'draft' } });
                if (order) {
                  await prisma.order.update({ 
                    where: { id: order.id }, 
                    data: { 
                      shippingFee: fee, 
                      deliveryMethod: method,
                      shippingAddress: method === 'shipping' ? toolData.params.address : null
                    } 
                  });
                  toolResultString = `Kalkulasi selesai. Metode: ${method}. Ongkir: ${replyFee}. Total keranjang + ongkir = Rp ${Number(order.totalAmount) + fee}. Sampaikan rincian ini ke pelanggan dan tanyakan apakah ingin diproses checkout sekarang.`;
                } else {
                  toolResultString = 'Gagal: Keranjang masih kosong. Tambahkan produk ke keranjang dulu.';
                }
              } else if (toolData.action === 'checkout' && businessProfileId && customerPhone) {
                const order = await prisma.order.findFirst({ where: { businessProfileId, customerPhone, status: 'draft' }, include: { items: true } });
                if (order && order.items.length > 0) {
                  await prisma.order.update({ where: { id: order.id }, data: { status: 'pending_payment' } });
                  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                  const invoiceLink = `${baseUrl}/pay/${order.id}`;
                  const grandTotal = Number(order.totalAmount) + Number(order.shippingFee);
                  toolResultString = `Checkout berhasil. Order ID: ${order.orderNumber}. Grand Total: Rp ${grandTotal}. BERIKAN LINK INVOICE INI KE PELANGGAN UNTUK MEMBAYAR: ${invoiceLink}`;
                } else {
                  toolResultString = 'Gagal checkout: Keranjang kosong.';
                }
              } else if (toolData.action === 'verify_payment' && businessProfileId && customerPhone) {
                const order = await prisma.order.findFirst({ where: { businessProfileId, customerPhone, status: 'pending_payment' }, orderBy: { createdAt: 'desc' } });
                if (order) {
                  toolResultString = `Sistem mencatat pesanan ${order.orderNumber} sedang menunggu pembayaran. Katakan kepada pelanggan bahwa pembayaran akan diverifikasi manual oleh Admin kami. Jangan menyebut lunas jika belum dikonfirmasi Admin.`;
                } else {
                  toolResultString = 'Gagal verifikasi: Tidak ada pesanan berstatus pending_payment untuk nomor ini.';
                }
              } else if (toolData.action === 'check_availability' && businessProfileId) {
                // Fix Timezone: Append +07:00 (WIB) before parsing
                const requestedDateTime = new Date(`${toolData.params.date}T${toolData.params.hour}:00+07:00`);
                const existing = await prisma.booking.findFirst({
                  where: {
                    businessProfileId,
                    bookingDate: requestedDateTime,
                    status: { not: 'cancelled' }
                  }
                });
                if (existing) {
                  toolResultString = `Jadwal penuh: Sudah ada pesanan di jam ${toolData.params.hour} pada ${toolData.params.date}. Tawarkan jam lain ke pelanggan.`;
                } else {
                  toolResultString = `Tersedia: Slot jam ${toolData.params.hour} pada ${toolData.params.date} KOSONG. Tanyakan apakah pelanggan ingin dibookingkan.`;
                }
              } else if (toolData.action === 'create_booking' && businessProfileId && customerPhone) {
                // Fix Timezone: Append +07:00 (WIB) before parsing
                const requestedDateTime = new Date(`${toolData.params.date}T${toolData.params.hour}:00+07:00`);
                
                try {
                  // Atomic check and create to prevent double booking race condition
                  const newBooking = await prisma.$transaction(async (tx) => {
                    const existing = await tx.booking.findFirst({
                      where: {
                        businessProfileId,
                        bookingDate: requestedDateTime,
                        status: { not: 'cancelled' }
                      }
                    });
                    if (existing) {
                      throw new Error('SLOT_TAKEN');
                    }
                    return await tx.booking.create({
                      data: {
                        businessProfileId,
                        customerPhone,
                        customerName: customerName || 'Customer',
                        serviceName: toolData.params.serviceName || 'Layanan Umum',
                        bookingDate: requestedDateTime,
                        status: 'pending'
                      }
                    });
                  });
                  toolResultString = `Booking BERHASIL DIBUAT (Kode: ${newBooking.id.substring(0,6)}). Konfirmasikan ini ke pelanggan dengan ramah.`;
                } catch (err: any) {
                  if (err.message === 'SLOT_TAKEN') {
                    toolResultString = 'Gagal: Maaf, pada jam tersebut slot sudah terisi (double-booking). Silakan tawarkan jam lain.';
                  } else {
                    toolResultString = 'Gagal: Terjadi kesalahan saat menyimpan booking.';
                  }
                }
              } else if (toolData.action === 'record_testimonial' && businessProfileId && customerPhone) {
                const ratingNum = Number(toolData.params.rating) || 5;
                const reviewText = toolData.params.review || '';
                
                // Cari order terakhir yang completed
                const lastCompletedOrder = await prisma.order.findFirst({
                  where: { businessProfileId, customerPhone, status: 'completed' },
                  orderBy: { createdAt: 'desc' }
                });

                if (lastCompletedOrder) {
                  // Cek apakah sudah memberikan review
                  const existingReview = await prisma.testimonial.findUnique({
                    where: { orderId: lastCompletedOrder.id }
                  });
                  if (!existingReview) {
                    await prisma.testimonial.create({
                      data: {
                        businessProfileId,
                        orderId: lastCompletedOrder.id,
                        customerName: customerName || lastCompletedOrder.customerName || 'Customer',
                        customerPhone,
                        rating: Math.max(1, Math.min(5, ratingNum)),
                        reviewText
                      }
                    });
                    toolResultString = `Ulasan berhasil direkam. Sampaikan terima kasih kepada pelanggan atas penilaian ${ratingNum} bintangnya!`;
                  } else {
                    toolResultString = `Pelanggan sudah pernah memberikan ulasan untuk pesanan terakhirnya. Sampaikan terima kasih atas tambahan masukannya.`;
                  }
                } else {
                  toolResultString = `Gagal: Tidak ditemukan pesanan yang sudah 'completed' untuk nomor ini. Ucapkan terima kasih saja.`;
                }
              } else if (toolData.action === 'request_human' && businessProfileId && customerPhone) {
                const convoState = await prisma.conversationState.findFirst({
                  where: { businessProfileId, customerPhone, status: 'ai_active' }
                });
                if (convoState) {
                  const until = new Date();
                  until.setHours(until.getHours() + 24);
                  await prisma.conversationState.update({ where: { id: convoState.id }, data: { status: 'waiting_admin', handoverUntil: until } });
                  
                  // Generate Smart Summary Asynchronously
                  (async () => {
                    try {
                      const credentials = await getAICredentialCandidates(chatbotSetting);
                      if (credentials.length > 0) {
                        const summaryPrompt = "Rangkum percakapan berikut dalam 1-2 kalimat pendek untuk memberi tahu agen CS manusia apa masalah atau inti percakapan pelanggan saat ini. Hanya keluarkan ringkasan teks tanpa pembuka/penutup.\n\nRiwayat:\n" + chatHistory.slice(-6).map(c => `${c.role}: ${c.content}`).join('\n') + `\nuser: ${messageIn}`;
                        const res = await AIService.generateReply({
                          systemPrompt: "Kamu adalah asisten ringkasan yang objektif, fokus, dan sangat singkat.",
                          userMessage: summaryPrompt,
                          provider: credentials[0].provider,
                          model: credentials[0].model,
                          apiKey: credentials[0].apiKey,
                          maxTokens: 100
                        });
                        if (res && res.reply) {
                          await prisma.conversationState.update({ where: { id: convoState.id }, data: { summary: res.reply } });
                        }
                      }
                    } catch (e) {
                      console.error('Failed to generate smart summary via tool', e);
                    }
                  })();

                  toolResultString = `Percakapan berhasil dialihkan ke Admin. Katakan kepada pelanggan: "${chatbotSetting.handoverMessage || 'Baik, mohon tunggu sebentar. Saya akan menyambungkan Anda dengan CS kami.'}" dan BERHENTILAH MEMBALAS.`;
                } else {
                  toolResultString = 'Sudah dalam status menunggu admin.';
                }
              } else if (toolData.action === 'webhook' && actionWebhookUrl) {
                const webhookRes = await fetch(chatbotSetting.actionWebhookUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: toolData.action, params: toolData.params, customerMessage: messageIn }),
                  signal: AbortSignal.timeout(15000),
                });
                if (webhookRes.ok) toolResultString = (await webhookRes.text()).slice(0, 20000);
              }

              const updatedHistory = [...chatHistory, { role: 'user', content: messageIn }, { role: 'assistant', content: finalReply }];
              const followUpUserMsg = `[SYSTEM RESPONSE FROM ACTION ${toolData.action}]:\n${toolResultString}\n\nBerikan balasan natural kepada pelanggan sesuai info sistem ini. JANGAN tampilkan JSON tool call lagi.`;

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
            usedCatalogUrl: params.usedCatalogUrl,
            sentiment: params.sentiment,
          }),
        }
      });
    } catch (error) {
      console.error("Failed to insert ChatLog:", error);
    }
  }
}
