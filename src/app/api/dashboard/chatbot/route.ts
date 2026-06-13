import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getActiveWahaSessionName } from '@/lib/waha-helpers';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    // Get Business Profile
    let businessProfile = await prisma.businessProfile.findFirst({ where: { userId } });

    if (!businessProfile) {
      businessProfile = await prisma.businessProfile.create({
        data: {
          userId,
          businessName: 'My Business',
          businessIndustry: 'Retail',
          businessDescription: '',
          address: '',
          openingHours: '08:00 - 17:00',
          adminPhone: '',
        },
      });
    }

    // Get Chatbot Setting
    let chatbotSetting = await prisma.chatbotSetting.findFirst({
      where: { userId, businessProfileId: businessProfile.id },
    });

    if (!chatbotSetting) {
      const uniqueSessionName = getActiveWahaSessionName(userId, businessProfile.id);

      chatbotSetting = await prisma.chatbotSetting.create({
        data: {
          userId,
          businessProfileId: businessProfile.id,
          botName: 'AI Assistant',
          fallbackMessage: 'Mohon maaf, saya tidak mengerti.',
          handoverMessage: 'Baik, saya akan menyambungkan Anda dengan admin kami.',
          handoverKeywords: 'admin, cs, manusia',
          outOfHoursMessage: 'Mohon maaf, saat ini kami sedang di luar jam operasional.',
          wahaSessionName: uniqueSessionName,
        },
      });
    }

    // Don't expose decrypted keys to frontend
    const safeChatbotSetting = {
      ...chatbotSetting,
      wahaApiKeyEncrypted: null, // Never expose
    };

    // Count active knowledge items
    const knowledgeCount = await prisma.knowledgeItem.count({
      where: { userId, isActive: true },
    });

    // Get active subscription with plan
    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: 'active' },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });



    // Get BotConfig (if any)
    const botConfig = await prisma.businessBotConfig.findUnique({ where: { userId } });
    
    // Check Global AI Key & Model
    const globalKey = await prisma.secretCredential.findUnique({ where: { key: 'FLAZ_API_KEY_GLOBAL' } });
    const hasGlobalKey = globalKey !== null && globalKey.isActive === true;
    let globalAiModel = null;
    if (hasGlobalKey) {
      const gModel = await prisma.secretCredential.findUnique({ where: { key: 'GLOBAL_AI_MODEL' } });
      if (gModel && gModel.isActive) {
        const { decrypt } = await import('@/lib/crypto');
        try { globalAiModel = decrypt(gModel.encryptedValue); } catch {}
      }
    }

    return NextResponse.json({
      businessProfile,
      chatbotSetting: safeChatbotSetting,
      botConfig,
      knowledgeCount,
      subscription,
      activePlan: subscription?.plan || null,
      hasGlobalKey,
      globalAiModel,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown';
    console.error('GET /api/dashboard/chatbot Error:', msg);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
