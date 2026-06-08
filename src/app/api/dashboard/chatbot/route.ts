import { NextResponse as Response } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Get Business Profile
    let businessProfile = await prisma.businessProfile.findFirst({
      where: { userId },
    });

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
      const crypto = require('crypto');
      const uniqueSessionName = `session_${userId.slice(0, 8)}_${crypto.randomBytes(4).toString('hex')}`;
      
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
    } else {
      // Don't expose decrypted keys to frontend
      chatbotSetting.aiApiKeyEncrypted = chatbotSetting.aiApiKeyEncrypted ? '******' : null;
      chatbotSetting.wahaApiKeyEncrypted = chatbotSetting.wahaApiKeyEncrypted ? '******' : null;
    }

    return Response.json({ businessProfile, chatbotSetting });
  } catch (error) {
    console.error('GET /api/dashboard/chatbot Error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
