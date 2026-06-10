import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';
import { saveChatbotSchema } from '@/lib/validations';
import { getActiveWahaSessionName } from '@/lib/waha-helpers';

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

    // Save Business Profile
    let profile = await prisma.businessProfile.findFirst({ where: { userId } });
    if (profile) {
      profile = await prisma.businessProfile.update({
        where: { id: profile.id },
        data: {
          businessName: data.businessName,
          businessIndustry: data.businessIndustry,
          businessDescription: data.businessDescription || '',
          address: data.address || '',
          openingHours: data.openingHours || '08:00 - 17:00',
          adminPhone: data.adminPhone || '',
          websiteUrl: data.websiteUrl || null,
          instagramUrl: data.instagramUrl || null,
          marketplaceUrl: data.marketplaceUrl || null,
        },
      });
    } else {
      profile = await prisma.businessProfile.create({
        data: {
          userId,
          businessName: data.businessName,
          businessIndustry: data.businessIndustry,
          businessDescription: data.businessDescription || '',
          address: data.address || '',
          openingHours: data.openingHours || '08:00 - 17:00',
          adminPhone: data.adminPhone || '',
          websiteUrl: data.websiteUrl || null,
          instagramUrl: data.instagramUrl || null,
          marketplaceUrl: data.marketplaceUrl || null,
        },
      });
    }

    // Encrypt keys if provided (and not masked)
    let encryptedAiApiKey: string | undefined = undefined;
    if (data.aiApiKey && data.aiApiKey !== '••••••••' && data.aiApiKey.length > 0) {
      const subscription = await prisma.subscription.findFirst({
        where: { userId, status: 'active' },
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      });
      const activePlan = subscription?.plan;
      const allowCustomApiKey = activePlan?.allowCustomApiKey ?? false;
      
      if (!allowCustomApiKey) {
        return NextResponse.json({ error: 'Plan Anda tidak mengizinkan Custom API Key. Silakan upgrade plan.' }, { status: 403 });
      }
      
      encryptedAiApiKey = encrypt(data.aiApiKey);
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
      fallbackMessage: data.fallbackMessage,
      handoverMessage: data.handoverMessage,
      handoverKeywords: data.handoverKeywords,
      outOfHoursMessage: data.outOfHoursMessage,
      aiProvider: data.aiProvider,
      aiModel: data.aiModel,
      ...(encryptedAiApiKey !== undefined && { aiApiKeyEncrypted: encryptedAiApiKey }),
      dailyChatLimit: data.dailyChatLimit,
      monthlyChatLimit: data.monthlyChatLimit,
      // wahaSessionName is preserved — never overwritten from user input
      wahaSessionName: sessionName,
      n8nWebhookUrl: data.n8nWebhookUrl || null,
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
          businessName: data.businessName,
          businessDescription: data.businessDescription || '',
          operationalHours: data.openingHours || '08:00 - 17:00',
          address: data.address || '',
          humanAdminContact: data.adminPhone || '',
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
          ...(data.templateId && { templateId: data.templateId, isBotActive: true }),
        }
      });
    } else if (data.templateId) {
      await prisma.businessBotConfig.create({
        data: {
          userId,
          templateId: data.templateId,
          businessName: data.businessName,
          businessDescription: data.businessDescription || '',
          operationalHours: data.openingHours || '08:00 - 17:00',
          address: data.address || '',
          humanAdminContact: data.adminPhone || '',
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
