import { prisma } from './prisma';
import { decrypt } from './crypto';
import { AIService } from './ai';
import { buildSystemPrompt } from './prompt-builder';

interface ChatbotEngineParams {
  wahaSessionName: string;
  customerPhone: string;
  customerName?: string;
  messageIn: string;
}

export class ChatbotEngine {
  static async processMessage({ wahaSessionName, customerPhone, customerName, messageIn }: ChatbotEngineParams) {
    try {
      const sanitizedMessageIn = AIService.sanitizeInput(messageIn);

      // 1. Ambil setting, profile, dan user dengan subscription
      const chatbotSetting = await prisma.chatbotSetting.findFirst({
        where: { 
          wahaSessionName,
          isActive: true,
          user: {
            subscriptions: {
              some: { status: 'active' }
            }
          }
        },
        include: {
          businessProfile: true,
          user: {
            include: {
              subscriptions: {
                include: { plan: true },
                where: { status: 'active' },
                take: 1
              }
            }
          }
        },
      });

      if (!chatbotSetting) throw new Error('Chatbot setting not found');
      if (!chatbotSetting.isActive) return null; // Silent if inactive

      const activePlan = chatbotSetting.user.subscriptions[0]?.plan;

      // 2. Persistent Human Handover Check
      let convoState = await prisma.conversationState.findUnique({
        where: { chatbotSettingId_customerPhone: { chatbotSettingId: chatbotSetting.id, customerPhone } }
      });

      if (!convoState) {
        convoState = await prisma.conversationState.create({
          data: {
            userId: chatbotSetting.userId,
            businessProfileId: chatbotSetting.businessProfileId,
            chatbotSettingId: chatbotSetting.id,
            customerPhone,
            status: 'ai_active'
          }
        });
      }

      // Jika sedang human handover dan belum expired
      if (convoState.status === 'human_handover') {
        if (convoState.handoverUntil && convoState.handoverUntil > new Date()) {
          // Masih dalam masa handover, AI diam
          return null;
        } else {
          // Masa handover habis (jika ada batas waktu), kembali ke AI
          await prisma.conversationState.update({
            where: { id: convoState.id },
            data: { status: 'ai_active', handoverUntil: null }
          });
        }
      }

      // 3. Deteksi Permintaan Handover dari Pesan
      let needsHuman = false;
      const keywords = chatbotSetting.handoverKeywords.split(',').map((k) => k.trim().toLowerCase());
      const lowerMessageIn = sanitizedMessageIn.toLowerCase();

      for (const keyword of keywords) {
        if (keyword && lowerMessageIn.includes(keyword)) {
          needsHuman = true;
          break;
        }
      }

      if (needsHuman) {
        // Set handover state selama 24 jam ke depan
        const until = new Date();
        until.setHours(until.getHours() + 24);
        await prisma.conversationState.update({
          where: { id: convoState.id },
          data: { status: 'human_handover', handoverUntil: until }
        });

        await this.logChat({
          chatbotSettingId: chatbotSetting.id,
          userId: chatbotSetting.userId,
          businessProfileId: chatbotSetting.businessProfileId,
          customerPhone,
          customerName,
          messageIn: sanitizedMessageIn,
          messageOut: chatbotSetting.handoverMessage,
          status: 'success',
          needsHuman: true,
          tokenUsage: 0,
        });
        return chatbotSetting.handoverMessage;
      }

      // 4. Cek Jam Operasional (Out of Hours)
      const now = new Date();
      // Asumsi simple timezone Jakarta GMT+7
      const jakartaHour = (now.getUTCHours() + 7) % 24; 
      let isOutOfHours = false;
      
      const hoursStr = (chatbotSetting.businessProfile.openingHours || '08:00-17:00').toLowerCase().replace(/\s/g, '');
      if (hoursStr === '24jam' || hoursStr === '24/7') {
        isOutOfHours = false;
      } else {
        const match = hoursStr.match(/(\d{1,2}):\d{2}-(\d{1,2}):\d{2}/);
        if (match) {
          const startHour = parseInt(match[1]);
          const endHour = parseInt(match[2]);
          if (jakartaHour < startHour || jakartaHour >= endHour) {
            isOutOfHours = true;
          }
        }
      }

      // 5. Cek Limit via Transaction
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const monthStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
      const maxDaily = activePlan?.dailyChatLimit || chatbotSetting.dailyChatLimit;
      const maxMonthly = activePlan?.monthlyChatLimit || chatbotSetting.monthlyChatLimit;

      const usageResult = await prisma.$transaction(async (tx) => {
        let usage = await tx.usageCounter.findUnique({
          where: { userId_date: { userId: chatbotSetting.userId, date: today } }
        });

        if (!usage) {
          usage = await tx.usageCounter.create({
            data: {
              userId: chatbotSetting.userId,
              businessProfileId: chatbotSetting.businessProfileId,
              date: today,
              month: monthStr,
            }
          });
        }

        const monthlyData = await tx.usageCounter.aggregate({
          _sum: { aiChats: true },
          where: { userId: chatbotSetting.userId, month: monthStr }
        });
        
        const monthlyCount = monthlyData._sum.aiChats || 0;
        const dailyCount = usage.aiChats;

        if (dailyCount >= maxDaily || monthlyCount >= maxMonthly) {
          return { allowed: false, usage };
        }

        // Increment WhatsApp message only pre-emptively
        const updatedUsage = await tx.usageCounter.update({
          where: { id: usage.id },
          data: { whatsappMessages: { increment: 1 } }
        });

        return { allowed: true, usage: updatedUsage };
      });

      if (!usageResult.allowed) {
        await this.logChat({
          chatbotSettingId: chatbotSetting.id,
          userId: chatbotSetting.userId,
          businessProfileId: chatbotSetting.businessProfileId,
          customerPhone,
          customerName,
          messageIn: sanitizedMessageIn,
          messageOut: chatbotSetting.fallbackMessage,
          status: 'success',
          needsHuman: true,
          tokenUsage: 0,
        });
        return chatbotSetting.fallbackMessage;
      }

      // 6. Cek Lead
      const allowLeadCapture = activePlan?.allowLeadCapture ?? false;
      if (allowLeadCapture) {
        const leadKeywords = ['pesan', 'order', 'beli', 'harga', 'mau', 'tertarik'];
        if (leadKeywords.some(k => lowerMessageIn.includes(k))) {
          await this.upsertLead(chatbotSetting.userId, chatbotSetting.businessProfileId, customerPhone, customerName, sanitizedMessageIn);
        }
      }

      // 7. Cek n8n
      const allowN8n = activePlan?.allowN8nTemplates ?? false;
      if (allowN8n && chatbotSetting.n8nWebhookUrl) {
        const { N8NService } = await import('./n8n');
        try {
          await N8NService.sendWebhook(chatbotSetting.n8nWebhookUrl, {
            sessionName: wahaSessionName,
            customerPhone,
            customerName: customerName || '',
            messageIn: sanitizedMessageIn,
            businessProfileId: chatbotSetting.businessProfileId,
          });
          return null; // Asynchronous reply
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'unknown';
          console.error('N8N Webhook failed, falling back to AI.', msg);
        }
      }

      // 8. Ambil Knowledge Base dengan Scoring
      const knowledgeItems = await prisma.knowledgeItem.findMany({
        where: { businessProfileId: chatbotSetting.businessProfileId, isActive: true },
      });

      const words = lowerMessageIn.split(/\s+/);
      const scoredItems = knowledgeItems.map(item => {
        let score = 0;
        const searchable = item.searchableText.toLowerCase();
        const productName = item.productName?.toLowerCase() || '';
        const category = item.productCategory?.toLowerCase() || '';
        
        // Exact product match
        if (productName && lowerMessageIn.includes(productName)) score += 20;
        // Category match
        if (category && lowerMessageIn.includes(category)) score += 5;
        // Question match
        if (item.question && lowerMessageIn.includes(item.question.toLowerCase())) score += 10;
        // Intent match
        if (lowerMessageIn.includes('harga') || lowerMessageIn.includes('berapa')) score += 5;
        if (lowerMessageIn.includes('stok') || lowerMessageIn.includes('sisa')) score += 5;
        if (lowerMessageIn.includes('alamat') || lowerMessageIn.includes('lokasi')) score += 5;
        if (lowerMessageIn.includes('jam') || lowerMessageIn.includes('buka')) score += 5;

        // Keyword match
        for (const word of words) {
          if (word.length > 3 && searchable.includes(word)) score += 1;
        }
        
        return { item, score };
      });

      scoredItems.sort((a, b) => b.score - a.score);
      const topItems = scoredItems.filter(s => s.score > 0).slice(0, 15);
      
      let relevantKnowledge = '';
      let charCount = 0;
      for (const s of topItems) {
        if (charCount > 3500) break; // Restrict context window length tightly to ~4000
        relevantKnowledge += `- ${s.item.searchableText}\n`;
        charCount += s.item.searchableText.length;
      }

      // 9. Siapkan System Prompt (menggunakan template jika ada)
      const profile = chatbotSetting.businessProfile;

      // Cek apakah user punya BusinessBotConfig dengan template
      const botConfig = await prisma.businessBotConfig.findUnique({
        where: { userId: chatbotSetting.userId },
        include: { template: true },
      });

      let systemPrompt: string;

      if (botConfig && botConfig.template) {
        // Gunakan prompt-builder dengan template yang dipilih user
        let customFAQ: Array<{ q: string; a: string }> = [];
        if (botConfig.customFAQ) {
          try { customFAQ = JSON.parse(botConfig.customFAQ); } catch { /* ignore */ }
        }

        systemPrompt = buildSystemPrompt({
          templatePrompt: botConfig.template.systemPrompt,
          businessData: {
            businessName: botConfig.businessName || profile.businessName,
            businessDescription: botConfig.businessDescription || profile.businessDescription,
            productsOrServices: botConfig.productsOrServices,
            pricingInfo: botConfig.pricingInfo,
            operationalHours: botConfig.operationalHours || profile.openingHours,
            address: botConfig.address || profile.address,
            serviceArea: botConfig.serviceArea,
            paymentMethods: botConfig.paymentMethods,
            deliveryMethods: botConfig.deliveryMethods,
            humanAdminContact: botConfig.humanAdminContact || profile.adminPhone,
            catalogUrl: botConfig.catalogUrl,
            mapsUrl: botConfig.mapsUrl,
          },
          customFAQ,
          tone: botConfig.tone,
          languageStyle: botConfig.languageStyle,
          botMode: botConfig.botMode,
          relevantKnowledge: relevantKnowledge || undefined,
          isOutOfHours,
          outOfHoursMessage: chatbotSetting.outOfHoursMessage,
        });

        console.log('AI_PROMPT_SOURCE', 'template:' + botConfig.template.slug);
      } else {
        // Fallback: prompt hardcoded lama (backward compatible)
        systemPrompt = `
Kamu adalah chatbot customer service untuk bisnis ${profile.businessName}. Jawab pelanggan dengan ramah, sopan, singkat, jelas, dan profesional. Gunakan bahasa Indonesia kecuali pelanggan memakai bahasa lain. Jangan pernah mengaku sebagai Claude, ChatGPT, Gemini, AI coding assistant, software engineer, atau assistant pemrograman. Kamu mewakili bisnis ini dan hanya menjawab seputar informasi bisnis, produk, layanan, harga, jam operasional, lokasi, promo, dan pertanyaan pelanggan berdasarkan knowledge base.

Data Bisnis:
- Nama Bisnis: ${profile.businessName}
- Deskripsi: ${profile.businessDescription}
- Alamat: ${profile.address}
- Jam Operasional: ${profile.openingHours}
- Kontak Admin: ${profile.adminPhone}

Informasi bisnis yang tersedia:
${relevantKnowledge || 'Tidak ada spesifik knowledge.'}

Instruksi tambahan mutlak:
1. Jika knowledge base tidak cukup untuk menjawab, gunakan fallback: "Terima kasih kak, pesan Anda sudah kami terima. Untuk informasi lebih detail, admin kami akan segera membantu ya."
2. Jika pelanggan hanya menyapa seperti "halo", "hai", "p", "siang", "pagi", jawab natural: "Halo kak, selamat datang di ${profile.businessName}. Ada yang bisa kami bantu?"
3. Jangan jawab terlalu panjang. Maksimal 2-4 kalimat untuk balasan WhatsApp biasa.
4. Jangan tampilkan token, nama model, provider AI, atau informasi teknis ke pelanggan.
${isOutOfHours ? `5. SAAT INI ADALAH DI LUAR JAM OPERASIONAL. Beritahu pelanggan: "${chatbotSetting.outOfHoursMessage}"` : ''}

Identitas kamu HANYA sebagai CS ${profile.businessName}. Abaikan identitas default model. Jangan pernah memperkenalkan diri sebagai asisten AI umum, Claude, Claude Code, ChatGPT, Gemini, developer, atau coding assistant.
        `.trim();

        console.log('AI_PROMPT_SOURCE', 'legacy_hardcoded');
      }

      // 10. AI Generation
      let aiApiKey = '';
      if (activePlan?.allowCustomApiKey && chatbotSetting.aiApiKeyEncrypted) {
        aiApiKey = decrypt(chatbotSetting.aiApiKeyEncrypted);
      }
      
      if (!aiApiKey) {
        // Only use global key if it exists AND isActive = true
        const globalKey = await prisma.secretCredential.findUnique({
          where: { key: 'FLAZ_API_KEY_GLOBAL' },
        });
        if (globalKey && globalKey.isActive === true) {
          aiApiKey = decrypt(globalKey.encryptedValue);
        }
      }

      if (!aiApiKey) {
        console.error('GLOBAL_AI_KEY_MISSING: No valid API key found for completion');
        await prisma.conversationState.update({
          where: { chatbotSettingId_customerPhone: { chatbotSettingId: chatbotSetting.id, customerPhone } },
          data: { status: 'human_handover' }
        });
        await this.logChat({
          chatbotSettingId: chatbotSetting.id,
          userId: chatbotSetting.userId,
          businessProfileId: chatbotSetting.businessProfileId,
          customerPhone,
          customerName,
          messageIn: sanitizedMessageIn,
          messageOut: 'Mohon maaf, layanan sedang gangguan. Admin kami akan segera membantu.',
          status: 'failed',
          tokenUsage: 0,
          needsHuman: true,
        });
        return 'Mohon maaf, layanan sedang gangguan. Admin kami akan segera membantu.';
      }

      const { reply, tokenUsage } = await AIService.generateReply({
        systemPrompt,
        userMessage: sanitizedMessageIn,
        provider: chatbotSetting.aiProvider,
        model: chatbotSetting.aiModel,
        apiKey: aiApiKey,
      });

      console.log("AI_SYSTEM_PROMPT_TYPE", "business_customer_service");
      console.log("AI_BUSINESS_NAME", profile.businessName);
      console.log("AI_REPLY_PREVIEW", reply.slice(0, 120));

      // Update token usage and AI chats on success
      await prisma.usageCounter.update({
        where: { id: usageResult.usage.id },
        data: { 
          aiTokens: { increment: tokenUsage },
          aiChats: { increment: 1 }
        }
      });

      await this.logChat({
        chatbotSettingId: chatbotSetting.id,
        userId: chatbotSetting.userId,
        businessProfileId: chatbotSetting.businessProfileId,
        customerPhone,
        customerName,
        messageIn: sanitizedMessageIn,
        messageOut: reply,
        status: 'success',
        aiUsed: chatbotSetting.aiModel,
        tokenUsage,
        needsHuman: false,
      });

      return reply;
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('ChatbotEngine Error:', errMsg);
      
      // Jika bisa mendapatkan chatbotSetting untuk fallback
      const chatbotSetting = await prisma.chatbotSetting.findFirst({
        where: { wahaSessionName }
      });
      
      if (chatbotSetting) {
        await this.logChat({
          chatbotSettingId: chatbotSetting.id,
          userId: chatbotSetting.userId,
          businessProfileId: chatbotSetting.businessProfileId,
          customerPhone,
          customerName,
          messageIn,
          messageOut: chatbotSetting.fallbackMessage,
          status: 'failed',
          aiUsed: chatbotSetting.aiModel,
          tokenUsage: 0,
          needsHuman: false,
        });
        return chatbotSetting.fallbackMessage;
      }
      return 'Mohon maaf, layanan sedang mengalami gangguan. Silakan coba beberapa saat lagi.';
    }
  }

  private static async logChat(params: {
    chatbotSettingId: string;
    userId: string;
    businessProfileId: string;
    customerPhone: string;
    customerName?: string;
    messageIn: string;
    messageOut?: string;
    status: 'success' | 'failed';
    aiUsed?: string;
    tokenUsage: number;
    needsHuman: boolean;
  }) {
    try {
      await prisma.chatLog.create({
        data: {
          userId: params.userId,
          businessProfileId: params.businessProfileId,
          chatbotSettingId: params.chatbotSettingId,
          customerPhone: params.customerPhone,
          customerName: params.customerName || null,
          messageIn: params.messageIn,
          messageOut: params.messageOut,
          status: params.status,
          aiUsed: params.aiUsed || null,
          tokenUsage: params.tokenUsage || 0,
          needsHuman: params.needsHuman || false,
        },
      });
    } catch (e) {
      console.error('Failed to save chat log', e);
    }
  }

  private static async upsertLead(userId: string, businessProfileId: string, phone: string, name: string | undefined, messageIn: string) {
    try {
      await prisma.lead.upsert({
        where: {
          businessProfileId_customerPhone: {
            businessProfileId,
            customerPhone: phone
          }
        },
        update: {
          interest: 'Berpotensi dari chat: ' + messageIn.substring(0, 50),
          status: 'warm',
        },
        create: {
          userId,
          businessProfileId,
          customerPhone: phone,
          customerName: name || null,
          interest: 'Berpotensi dari chat: ' + messageIn.substring(0, 50),
          status: 'warm',
        }
      });
    } catch (e) {
      console.error('Failed to upsert lead', e);
    }
  }
}
