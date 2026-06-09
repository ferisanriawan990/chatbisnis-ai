import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
      const crypto = await import('crypto');
      const isCoreMode = process.env.WAHA_CORE_MODE === 'true';
      let uniqueSessionName = isCoreMode ? 'default' : `session_${userId.slice(0, 8)}_${crypto.randomBytes(4).toString('hex')}`;
      
      if (isCoreMode) {
        const existingDefault = await prisma.chatbotSetting.findUnique({ where: { wahaSessionName: 'default' } });
        if (existingDefault) {
          // Fallback if 'default' is already taken so we don't crash on initial load. The error will trigger on start/save.
          uniqueSessionName = `session_${userId.slice(0, 8)}_${crypto.randomBytes(4).toString('hex')}`;
        }
      }

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
      aiApiKeyEncrypted: chatbotSetting.aiApiKeyEncrypted ? '••••••••' : null,
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

    const hasCustomAiKey = Boolean(chatbotSetting.aiApiKeyEncrypted);

    return NextResponse.json({
      businessProfile,
      chatbotSetting: safeChatbotSetting,
      knowledgeCount,
      subscription,
      activePlan: subscription?.plan || null,
      hasCustomAiKey,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown';
    console.error('GET /api/dashboard/chatbot Error:', msg);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
