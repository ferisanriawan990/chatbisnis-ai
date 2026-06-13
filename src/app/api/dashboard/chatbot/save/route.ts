import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { saveChatbotSchema } from '@/lib/validations';
import { getActiveWahaSessionName } from '@/lib/waha-helpers';
import { validatePublicHttpsUrl } from '@/lib/security';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const body = await req.json();
    const parsed = saveChatbotSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message);
      return NextResponse.json({ error: errors[0] }, { status: 400 });
    }

    const data = parsed.data;

    if (data.actionWebhookUrl && !validatePublicHttpsUrl(data.actionWebhookUrl)) {
      return NextResponse.json({ error: 'Webhook aksi harus berupa URL HTTPS publik.' }, { status: 400 });
    }

    // Save Business Profile
    let profile = await prisma.businessProfile.findFirst({ where: { userId } });
    if (profile) {
      profile = await prisma.businessProfile.update({
        where: { id: profile.id },
        data: {
          businessName: data.businessName !== undefined ? data.businessName : profile.businessName,
          businessIndustry: data.businessIndustry,
          businessDescription: data.businessDescription || '',
          address: data.address || '',
          openingHours: data.openingHours || '08:00 - 17:00',
          adminPhone: data.adminPhone || '',
          websiteUrl: data.websiteUrl || null,
          instagramUrl: data.instagramUrl || null,
          marketplaceUrl: data.marketplaceUrl || null,
          customLinks: data.customLinks ? JSON.stringify(data.customLinks) : null,
        },
      });
    } else {
      profile = await prisma.businessProfile.create({
        data: {
          userId,
          businessName: data.businessName || 'Bisnis Baru',
          businessIndustry: data.businessIndustry,
          businessDescription: data.businessDescription || '',
          address: data.address || '',
          openingHours: data.openingHours || '08:00 - 17:00',
          adminPhone: data.adminPhone || '',
          websiteUrl: data.websiteUrl || null,
          instagramUrl: data.instagramUrl || null,
          marketplaceUrl: data.marketplaceUrl || null,
          customLinks: data.customLinks ? JSON.stringify(data.customLinks) : null,
        },
      });
    }

    const chatbot = await prisma.chatbotSetting.findFirst({ where: { userId, businessProfileId: profile.id } });

    // Always preserve existing wahaSessionName or generate a new one
    const sessionName = chatbot?.wahaSessionName || getActiveWahaSessionName(userId, profile.id);

    const chatbotData = {
      botName: data.botName,
      // isActive is preserved from existing value — only changeable via /toggle
      isActive: chatbot?.isActive ?? false,
      toneStyle: data.toneStyle,
      language: data.language,
      useEmoji: data.useEmoji,
      maxReplyLength: data.maxReplyLength,
      allowSelling: data.allowSelling,
      allowPromoOffer: data.allowPromoOffer,
      allowVision: data.allowVision,
      fallbackMessage: data.fallbackMessage,
      handoverMessage: data.handoverMessage,
      handoverKeywords: data.handoverKeywords,
      outOfHoursMessage: data.outOfHoursMessage,
      aiProvider: data.aiProvider,
      aiModel: data.aiModel,
      dailyChatLimit: data.dailyChatLimit !== undefined ? Number(data.dailyChatLimit) : undefined,
      monthlyChatLimit: data.monthlyChatLimit !== undefined ? Number(data.monthlyChatLimit) : undefined,
      historyMessageCount: data.historyMessageCount !== undefined ? Number(data.historyMessageCount) : undefined,
      knowledgeCharLimit: data.knowledgeCharLimit !== undefined ? Number(data.knowledgeCharLimit) : undefined,
      actionWebhookUrl: data.actionWebhookUrl || null,
      // wahaSessionName is preserved — never overwritten from user input
      wahaSessionName: sessionName,
      // wahaBaseUrl, wahaApiKeyEncrypted, wahaServerId are NEVER set from user save
    };

    if (chatbot) {
      await prisma.chatbotSetting.update({
        where: { id: chatbot.id },
        data: chatbotData,
      });
    } else {
      await prisma.chatbotSetting.create({
        data: {
          userId,
          businessProfileId: profile.id,
          ...chatbotData,
        },
      });
    }

    // Sync back to BusinessBotConfig so Template Bot uses the latest info
    const botConfig = await prisma.businessBotConfig.findUnique({ where: { userId } });
    if (botConfig) {
      await prisma.businessBotConfig.update({
        where: { userId },
        data: {
          businessName: data.businessName !== undefined ? data.businessName : botConfig.businessName,
          businessDescription: data.businessDescription !== undefined ? data.businessDescription : botConfig.businessDescription,
          operationalHours: data.openingHours !== undefined ? data.openingHours : botConfig.operationalHours,
          address: data.address !== undefined ? data.address : botConfig.address,
          humanAdminContact: data.adminPhone !== undefined ? data.adminPhone : botConfig.humanAdminContact,
          tone: data.toneStyle !== undefined ? data.toneStyle : botConfig.tone,
          languageStyle: data.language !== undefined ? (data.language === 'en' ? 'id-en' : 'id') : botConfig.languageStyle,
          productsOrServices: data.productsOrServices !== undefined ? data.productsOrServices : botConfig.productsOrServices,
          pricingInfo: data.pricingInfo !== undefined ? data.pricingInfo : botConfig.pricingInfo,
          paymentMethods: data.paymentMethods !== undefined ? data.paymentMethods : botConfig.paymentMethods,
          deliveryMethods: data.deliveryMethods !== undefined ? data.deliveryMethods : botConfig.deliveryMethods,
          serviceArea: data.serviceArea !== undefined ? data.serviceArea : botConfig.serviceArea,
          catalogUrl: data.catalogUrl !== undefined ? data.catalogUrl : botConfig.catalogUrl,
          mapsUrl: data.mapsUrl !== undefined ? data.mapsUrl : botConfig.mapsUrl,
          customFAQ: data.customFAQ !== undefined ? data.customFAQ : botConfig.customFAQ,
          templateId: data.templateId || null,
          isBotActive: true,
        }
      });
    } else {
      await prisma.businessBotConfig.create({
        data: {
          userId,
          templateId: data.templateId || null,
          businessName: data.businessName || profile.businessName,
          businessDescription: data.businessDescription || profile.businessDescription || '',
          operationalHours: data.openingHours || profile.openingHours || '08:00 - 17:00',
          address: data.address || profile.address || '',
          humanAdminContact: data.adminPhone || profile.adminPhone || '',
          tone: data.toneStyle,
          languageStyle: data.language === 'en' ? 'id-en' : 'id',
          productsOrServices: data.productsOrServices || '',
          pricingInfo: data.pricingInfo || '',
          paymentMethods: data.paymentMethods || '',
          deliveryMethods: data.deliveryMethods || '',
          serviceArea: data.serviceArea || '',
          catalogUrl: data.catalogUrl || '',
          mapsUrl: data.mapsUrl || '',
          customFAQ: data.customFAQ || '',
          botMode: 'auto_reply',
          isBotActive: true,
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/dashboard/chatbot/save Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
