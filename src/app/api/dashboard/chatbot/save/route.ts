import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';
import { saveChatbotSchema } from '@/lib/validations';
import crypto from 'crypto';

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
      encryptedAiApiKey = encrypt(data.aiApiKey);
    }

    let encryptedWahaApiKey: string | undefined = undefined;
    if (data.wahaApiKey && data.wahaApiKey !== '••••••••' && data.wahaApiKey.length > 0) {
      encryptedWahaApiKey = encrypt(data.wahaApiKey);
    }

    // Generate unique session name if not provided
    let sessionName = data.wahaSessionName;
    if (!sessionName || sessionName.trim() === '') {
      sessionName = `session_${userId.slice(0, 8)}_${crypto.randomBytes(4).toString('hex')}`;
    }

    // Check unique wahaSessionName
    const chatbot = await prisma.chatbotSetting.findFirst({ where: { userId, businessProfileId: profile.id } });
    if (sessionName !== chatbot?.wahaSessionName) {
      const existing = await prisma.chatbotSetting.findUnique({ where: { wahaSessionName: sessionName } });
      if (existing && existing.id !== chatbot?.id) {
        return NextResponse.json(
          { error: 'Nama session WAHA sudah digunakan. Pilih nama lain.' },
          { status: 409 }
        );
      }
    }

    const chatbotData = {
      botName: data.botName,
      isActive: data.isActive ?? chatbot?.isActive ?? false,
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
      wahaBaseUrl: data.wahaBaseUrl || null,
      ...(encryptedWahaApiKey !== undefined && { wahaApiKeyEncrypted: encryptedWahaApiKey }),
      wahaSessionName: sessionName,
      n8nWebhookUrl: data.n8nWebhookUrl || null,
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/dashboard/chatbot/save Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
