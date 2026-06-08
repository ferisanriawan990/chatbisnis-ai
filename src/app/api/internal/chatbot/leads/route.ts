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
      interest,
      budget,
      address,
      status,
      notes,
    } = body;

    const chatbotSetting = await prisma.chatbotSetting.findUnique({
      where: { wahaSessionName },
    });

    if (!chatbotSetting) {
      return Response.json({ error: 'Chatbot setting not found for this session' }, { status: 404 });
    }

    // Upsert lead based on customerPhone and businessProfileId
    // Prisma does not have unique constraint on these two, so we findFirst then update/create
    let lead = await prisma.lead.findFirst({
      where: {
        businessProfileId: chatbotSetting.businessProfileId,
        customerPhone,
      },
    });

    if (lead) {
      lead = await prisma.lead.update({
        where: { id: lead.id },
        data: {
          customerName: customerName || lead.customerName,
          interest: interest || lead.interest,
          budget: budget || lead.budget,
          address: address || lead.address,
          status: status || lead.status,
          notes: notes || lead.notes,
        },
      });
    } else {
      lead = await prisma.lead.create({
        data: {
          userId: chatbotSetting.userId,
          businessProfileId: chatbotSetting.businessProfileId,
          customerPhone,
          customerName,
          interest,
          budget,
          address,
          status: status || 'cold',
          notes,
        },
      });
    }

    return Response.json({ success: true, lead });
  } catch (error) {
    console.error('POST /api/internal/chatbot/leads Error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
