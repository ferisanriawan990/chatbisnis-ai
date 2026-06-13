/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse as Response } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireHeaderSecret, parseJsonSafe } from '@/lib/security';
const leadSchema = z.object({
  whatsappSessionName: z.string(),
  customerPhone: z.string(),
  customerName: z.string().optional().nullable(),
  interest: z.string().optional().nullable(),
  budget: z.number().optional().nullable(),
  address: z.string().optional().nullable(),
  status: z.enum(['cold', 'warm', 'hot', 'converted', 'lost']).optional().default('cold'),
  notes: z.string().optional().nullable(),
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
    const parseResult = leadSchema.safeParse(body);
    
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

    // Upsert lead based on customerPhone and businessProfileId since it has a unique constraint
    const lead = await prisma.lead.upsert({
      where: {
        businessProfileId_customerPhone: {
          businessProfileId: chatbotSetting.businessProfileId,
          customerPhone: data.customerPhone,
        }
      },
      update: {
        customerName: data.customerName !== undefined ? data.customerName : undefined,
        interest: data.interest !== undefined ? data.interest : undefined,
        budget: data.budget !== undefined ? data.budget : undefined,
        address: data.address !== undefined ? data.address : undefined,
        status: data.status,
        notes: data.notes !== undefined ? data.notes : undefined,
      },
      create: {
        userId: chatbotSetting.userId,
        businessProfileId: chatbotSetting.businessProfileId,
        customerPhone: data.customerPhone,
        customerName: data.customerName,
        interest: data.interest,
        budget: data.budget,
        address: data.address,
        status: data.status,
        notes: data.notes,
      },
    });

    return Response.json({ success: true, lead });
  } catch (error) {
    console.error('POST /api/internal/chatbot/leads Error:', (error as Error).message);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
