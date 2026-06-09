import { NextResponse as Response } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const logSchema = z.object({
  wahaSessionName: z.string(),
  customerPhone: z.string(),
  customerName: z.string().optional().nullable(),
  messageIn: z.string(),
  messageOut: z.string().optional().nullable(),
  intent: z.string().optional().nullable(),
  aiUsed: z.string().optional().nullable(),
  status: z.enum(['success', 'failed']).optional().default('success'),
  errorMessage: z.string().optional().nullable(),
  needsHuman: z.boolean().optional().default(false),
  tokenUsage: z.number().optional().default(0),
});

export async function POST(req: Request) {
  try {
    const internalSecret = process.env.INTERNAL_API_KEY;
    if (!internalSecret) {
      console.error('INTERNAL_API_KEY is not configured.');
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const apiKey = req.headers.get('x-internal-api-key');
    if (apiKey !== internalSecret) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = logSchema.safeParse(body);
    
    if (!parseResult.success) {
      return Response.json({ error: 'Invalid payload', details: parseResult.error.format() }, { status: 400 });
    }

    const data = parseResult.data;

    const chatbotSetting = await prisma.chatbotSetting.findFirst({
      where: { wahaSessionName: data.wahaSessionName },
    });

    if (!chatbotSetting) {
      return Response.json({ error: 'Chatbot setting not found for this session' }, { status: 404 });
    }

    const chatLog = await prisma.chatLog.create({
      data: {
        userId: chatbotSetting.userId,
        businessProfileId: chatbotSetting.businessProfileId,
        chatbotSettingId: chatbotSetting.id,
        customerPhone: data.customerPhone,
        customerName: data.customerName,
        messageIn: data.messageIn,
        messageOut: data.messageOut,
        intent: data.intent,
        aiUsed: data.aiUsed,
        status: data.status,
        errorMessage: data.errorMessage,
        needsHuman: data.needsHuman,
        tokenUsage: data.tokenUsage,
      },
    });

    return Response.json({ success: true, chatLog });
  } catch (error) {
    console.error('POST /api/internal/chatbot/logs Error:', (error as Error).message);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
