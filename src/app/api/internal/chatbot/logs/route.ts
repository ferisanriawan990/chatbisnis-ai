/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse as Response } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireHeaderSecret, parseJsonSafe } from '@/lib/security';
const logSchema = z.object({
  whatsappSessionName: z.string(),
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
    if (!requireHeaderSecret(req, 'x-internal-api-key', process.env.INTERNAL_API_KEY)) {
      return Response.json({ error: 'Unauthorized or missing secret' }, { status: 401 });
    }

    const body = await parseJsonSafe<any>(req, 5 * 1024 * 1024);
    if (!body) {
      return Response.json({ error: 'Invalid or too large payload' }, { status: 400 });
    }
    const parseResult = logSchema.safeParse(body);
    
    if (!parseResult.success) {
      return Response.json({ error: 'Invalid payload', details: parseResult.error.format() }, { status: 400 });
    }

    const data = parseResult.data;

    const chatbotSetting = await prisma.chatbotSetting.findFirst({
      where: { whatsappSessionName: data.whatsappSessionName },
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
