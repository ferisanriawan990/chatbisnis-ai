import { prisma } from './prisma';
import { decrypt } from './crypto';
import { AIService } from './ai';
import { buildSystemPrompt } from './prompt-builder';
import { searchKnowledgeItems, buildProductAnswer, detectCustomerIntent } from './knowledge-search';

export interface ChatbotEngineParams {
  wahaServerId?: string;
  wahaSessionName: string;
  customerPhone: string;
  customerName?: string;
  messageIn: string;
  isTest?: boolean;
}

export interface ChatbotEngineResult {
  reply: string;
  metadata?: any;
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
          await this.sendLog({ ...params, chatbotSetting, messageOut: access.replyMessage, needsHuman: true, intent });
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

    // 6. Try Deterministic Reply
    const deterministicReply = buildProductAnswer(sanitizedMessageIn, matchedItems);
    if (deterministicReply) {
      if (!isTest) {
        await this.sendLog({ ...params, chatbotSetting, messageOut: deterministicReply, intent, knowledgeMatchCount, aiUsed: 'deterministic', promptSource: 'deterministic' });
      }
      return { 
        reply: deterministicReply, 
        metadata: { intent, knowledgeMatchCount, promptSource: 'deterministic', usedCatalogUrl: false, usedDeterministicReply: true } 
      };
    }

    // 7. Build Prompt & Call AI
    const systemPrompt = this.buildPrompt(chatbotSetting, botConfig, profile, matchedItems);
    const { replyMessage, tokenUsage, usedCatalogUrl, promptSource, aiModelUsed } = await this.callAI(chatbotSetting, activePlan, systemPrompt, sanitizedMessageIn, isTest);

    // 8. Record Usage & Log
    if (!isTest) {
      await prisma.usageCounter.update({
        where: { id: access.usageId! },
        data: { aiTokens: { increment: tokenUsage }, aiChats: { increment: 1 } }
      });
      await this.sendLog({ ...params, chatbotSetting, messageOut: replyMessage, tokenUsage, intent, promptSource, knowledgeMatchCount, usedCatalogUrl, aiUsed: aiModelUsed });
    }

    return { 
      reply: replyMessage, 
      metadata: { intent, knowledgeMatchCount, promptSource, usedCatalogUrl, tokenUsage, usedDeterministicReply: false } 
    };
  }

  private static async loadChatbotContext(wahaSessionName: string, wahaServerId?: string, isTest: boolean = false) {
    // Modify query to allow fallback. If serverId provided, use it. Otherwise just use session name.
    const whereClause: any = { wahaSessionName };
    if (wahaServerId) whereClause.wahaServerId = wahaServerId;
    if (!isTest) whereClause.isActive = true;

    const chatbotSetting = await prisma.chatbotSetting.findFirst({
      where: whereClause,
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
      return { allowed: false };
    }

    const keywords = chatbotSetting.handoverKeywords.split(',').map((k: string) => k.trim().toLowerCase());
    const lowerMessageIn = messageIn.toLowerCase();
    if (keywords.some((k: string) => k && lowerMessageIn.includes(k))) {
      const until = new Date();
      until.setHours(until.getHours() + 24);
      await prisma.conversationState.update({ where: { id: convoState.id }, data: { status: 'human_handover', handoverUntil: until } });
      return { allowed: false, replyMessage: chatbotSetting.handoverMessage };
    }

    // Out of Hours Check
    const now = new Date();
    const jakartaHour = (now.getUTCHours() + 7) % 24;
    const hoursStr = (chatbotSetting.businessProfile.openingHours || '08:00-17:00').toLowerCase().replace(/\s/g, '');
    if (hoursStr !== '24jam' && hoursStr !== '24/7') {
      const match = hoursStr.match(/(\d{1,2}):\d{2}-(\d{1,2}):\d{2}/);
      if (match) {
        if (jakartaHour < parseInt(match[1]) || jakartaHour >= parseInt(match[2])) {
          return { allowed: false, replyMessage: chatbotSetting.outOfHoursMessage };
        }
      }
    }

    // Usage Limits
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
    for (const item of matchedItems) {
      if (charCount > 3500) break;
      relevantKnowledge += `- ${item.searchableText}\n`;
      charCount += item.searchableText.length;
    }

    if (botConfig && botConfig.template && botConfig.isBotActive) {
      let customFAQ: Array<{ q: string; a: string }> = [];
      try { customFAQ = JSON.parse(botConfig.customFAQ || '[]'); } catch { /* ignore */ }
      
      return buildSystemPrompt({
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
        tone: botConfig.tone || chatbotSetting.toneStyle,
        languageStyle: botConfig.languageStyle || chatbotSetting.language,
        botMode: botConfig.botMode || 'auto_reply',
        relevantKnowledge,
      });
    } else {
      return `Anda adalah asisten virtual untuk ${profile.businessName}. ${profile.businessDescription}
Jawab dengan ${chatbotSetting.toneStyle} dalam bahasa ${chatbotSetting.language}.
Gunakan data referensi berikut jika relevan:
${relevantKnowledge}`;
    }
  }

  private static async callAI(chatbotSetting: any, activePlan: any, systemPrompt: string, messageIn: string, isTest: boolean) {
    let aiApiKey = chatbotSetting.aiApiKeyEncrypted ? decrypt(chatbotSetting.aiApiKeyEncrypted) : '';
    let aiModel = chatbotSetting.aiModel || 'gpt-4o-mini';

    const globalKey = await prisma.secretCredential.findUnique({ where: { key: 'FLAZ_API_KEY_GLOBAL' } });
    if (globalKey?.isActive) {
      aiApiKey = decrypt(globalKey.encryptedValue);
      const globalModel = await prisma.secretCredential.findUnique({ where: { key: 'GLOBAL_AI_MODEL' } });
      if (globalModel?.isActive) aiModel = decrypt(globalModel.encryptedValue);
    }

    if (!aiApiKey) {
      return { replyMessage: chatbotSetting.fallbackMessage, tokenUsage: 0, usedCatalogUrl: false, promptSource: 'error', aiModelUsed: aiModel };
    }

    const allowSelling = activePlan ? activePlan.allowSelling : chatbotSetting.allowSelling;
    const finalSystemPrompt = systemPrompt + (!allowSelling ? '\nDILARANG keras melakukan hard-selling atau promosi berlebihan.' : '');

    try {
      const aiResult = await AIService.generateReply({
        systemPrompt: finalSystemPrompt,
        userMessage: messageIn,
        provider: chatbotSetting.aiProvider,
        model: aiModel,
        apiKey: aiApiKey,
        maxTokens: chatbotSetting.maxReplyLength === 'pendek' ? 150 : chatbotSetting.maxReplyLength === 'panjang' ? 800 : 450,
      });

      return { replyMessage: aiResult.reply, tokenUsage: aiResult.tokenUsage || 0, usedCatalogUrl: Boolean(chatbotSetting.catalogUrl && aiResult.reply.includes(chatbotSetting.catalogUrl)), promptSource: 'ai', aiModelUsed: aiModel };
    } catch (error) {
      console.error('AI Error:', error);
      return { replyMessage: chatbotSetting.fallbackMessage, tokenUsage: 0, usedCatalogUrl: false, promptSource: 'error', aiModelUsed: aiModel };
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
          status: 'success',
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
