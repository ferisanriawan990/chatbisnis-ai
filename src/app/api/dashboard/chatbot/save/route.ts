import { NextResponse as Response } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();

    const {
      businessName,
      businessIndustry,
      businessDescription,
      address,
      openingHours,
      adminPhone,
      websiteUrl,
      instagramUrl,
      marketplaceUrl,
      botName,
      toneStyle,
      language,
      useEmoji,
      maxReplyLength,
      allowSelling,
      allowPromoOffer,
      fallbackMessage,
      handoverMessage,
      handoverKeywords,
      outOfHoursMessage,
      aiProvider,
      aiModel,
      aiApiKey,
      dailyChatLimit,
      monthlyChatLimit,
      wahaBaseUrl,
      wahaApiKey,
      wahaSessionName,
      n8nWebhookUrl,
    } = body;

    // Save Business Profile
    let profile = await prisma.businessProfile.findFirst({ where: { userId } });
    if (profile) {
      profile = await prisma.businessProfile.update({
        where: { id: profile.id },
        data: {
          businessName,
          businessIndustry,
          businessDescription,
          address,
          openingHours,
          adminPhone,
          websiteUrl,
          instagramUrl,
          marketplaceUrl,
        },
      });
    } else {
      profile = await prisma.businessProfile.create({
        data: {
          userId,
          businessName,
          businessIndustry,
          businessDescription,
          address,
          openingHours,
          adminPhone,
          websiteUrl,
          instagramUrl,
          marketplaceUrl,
        },
      });
    }

    // Encrypt keys if they are provided (and not just masked)
    let encryptedAiApiKey = undefined;
    if (aiApiKey && aiApiKey !== '******') {
      encryptedAiApiKey = encrypt(aiApiKey);
    }

    let encryptedWahaApiKey = undefined;
    if (wahaApiKey && wahaApiKey !== '******') {
      encryptedWahaApiKey = encrypt(wahaApiKey);
    }

    // Save Chatbot Setting
    let chatbot = await prisma.chatbotSetting.findFirst({ where: { userId, businessProfileId: profile.id } });
    if (chatbot) {
      chatbot = await prisma.chatbotSetting.update({
        where: { id: chatbot.id },
        data: {
          botName,
          toneStyle,
          language,
          useEmoji,
          maxReplyLength,
          allowSelling,
          allowPromoOffer,
          fallbackMessage,
          handoverMessage,
          handoverKeywords,
          outOfHoursMessage,
          aiProvider,
          aiModel,
          ...(encryptedAiApiKey !== undefined && { aiApiKeyEncrypted: encryptedAiApiKey }),
          dailyChatLimit: Number(dailyChatLimit),
          monthlyChatLimit: Number(monthlyChatLimit),
          wahaBaseUrl,
          ...(encryptedWahaApiKey !== undefined && { wahaApiKeyEncrypted: encryptedWahaApiKey }),
          wahaSessionName,
          n8nWebhookUrl,
        },
      });
    } else {
      chatbot = await prisma.chatbotSetting.create({
        data: {
          userId,
          businessProfileId: profile.id,
          botName,
          toneStyle,
          language,
          useEmoji,
          maxReplyLength,
          allowSelling,
          allowPromoOffer,
          fallbackMessage,
          handoverMessage,
          handoverKeywords,
          outOfHoursMessage,
          aiProvider,
          aiModel,
          aiApiKeyEncrypted: encryptedAiApiKey,
          dailyChatLimit: Number(dailyChatLimit) || 1000,
          monthlyChatLimit: Number(monthlyChatLimit) || 30000,
          wahaBaseUrl,
          wahaApiKeyEncrypted: encryptedWahaApiKey,
          wahaSessionName,
          n8nWebhookUrl,
        },
      });
    }

    return Response.json({ success: true, profile, chatbot });
  } catch (error) {
    console.error('POST /api/dashboard/chatbot/save Error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
