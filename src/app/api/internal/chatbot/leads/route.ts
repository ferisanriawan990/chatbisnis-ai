import { NextResponse as Response } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const leadSchema = z.object({
  wahaSessionName: z.string(),
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
    const parseResult = leadSchema.safeParse(body);
    
    if (!parseResult.success) {
      return Response.json({ error: 'Invalid payload', details: parseResult.error.format() }, { status: 400 });
    }

    const data = parseResult.data;

    const chatbotSetting = await prisma.chatbotSetting.findUnique({
      where: { wahaSessionName: data.wahaSessionName },
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
