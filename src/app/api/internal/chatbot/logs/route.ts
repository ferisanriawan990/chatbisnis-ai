import { NextResponse as Response } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get('x-internal-api-key');

    if (apiKey !== process.env.INTERNAL_API_KEY) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      wahaSessionName,
      customerPhone,
      customerName,
      messageIn,
      messageOut,
      intent,
      aiUsed,
      status,
      errorMessage,
      needsHuman,
      tokenUsage,
    } = body;

    const chatbotSetting = await prisma.chatbotSetting.findUnique({
      where: { wahaSessionName },
    });

    if (!chatbotSetting) {
      return Response.json({ error: 'Chatbot setting not found for this session' }, { status: 404 });
    }

    const chatLog = await prisma.chatLog.create({
      data: {
        userId: chatbotSetting.userId,
        businessProfileId: chatbotSetting.businessProfileId,
        chatbotSettingId: chatbotSetting.id,
        customerPhone,
        customerName,
        messageIn,
        messageOut,
        intent,
        aiUsed,
        status,
        errorMessage,
        needsHuman: needsHuman || false,
        tokenUsage: tokenUsage || 0,
      },
    });

    return Response.json({ success: true, chatLog });
  } catch (error) {
    console.error('POST /api/internal/chatbot/logs Error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
