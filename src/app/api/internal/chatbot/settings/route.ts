import { NextResponse as Response } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sessionName = url.searchParams.get('session');
    const apiKey = req.headers.get('x-internal-api-key');

    if (apiKey !== process.env.INTERNAL_API_KEY) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!sessionName) {
      return Response.json({ error: 'Session name is required' }, { status: 400 });
    }

    const chatbotSetting = await prisma.chatbotSetting.findUnique({
      where: { wahaSessionName: sessionName },
      include: {
        businessProfile: true,
      },
    });

    if (!chatbotSetting) {
      return Response.json({ error: 'Chatbot setting not found for this session' }, { status: 404 });
    }

    if (!chatbotSetting.isActive) {
      return Response.json({ error: 'Chatbot is not active' }, { status: 400 });
    }

    const knowledgeItems = await prisma.knowledgeItem.findMany({
      where: {
        businessProfileId: chatbotSetting.businessProfileId,
        isActive: true,
      },
    });

    // Decrypt keys
    const aiApiKey = chatbotSetting.aiApiKeyEncrypted ? decrypt(chatbotSetting.aiApiKeyEncrypted) : null;
    const wahaApiKey = chatbotSetting.wahaApiKeyEncrypted ? decrypt(chatbotSetting.wahaApiKeyEncrypted) : null;

    // Remove encrypted keys from response
    const { aiApiKeyEncrypted, wahaApiKeyEncrypted, ...safeSettings } = chatbotSetting;

    return Response.json({
      chatbotSetting: safeSettings,
      businessProfile: chatbotSetting.businessProfile,
      knowledgeItems,
      aiApiKey,
      wahaApiKey,
    });
  } catch (error) {
    console.error('GET /api/internal/chatbot/settings Error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
