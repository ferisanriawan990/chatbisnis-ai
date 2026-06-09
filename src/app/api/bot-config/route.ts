import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod/v4';

const botConfigSchema = z.object({
  templateId: z.string().uuid(),
  businessName: z.string().min(1).max(200),
  businessDescription: z.string().min(1).max(5000),
  productsOrServices: z.string().max(10000).optional().nullable(),
  pricingInfo: z.string().max(10000).optional().nullable(),
  operationalHours: z.string().max(200).optional().nullable(),
  address: z.string().max(1000).optional().nullable(),
  serviceArea: z.string().max(500).optional().nullable(),
  paymentMethods: z.string().max(500).optional().nullable(),
  deliveryMethods: z.string().max(500).optional().nullable(),
  humanAdminContact: z.string().max(100).optional().nullable(),
  catalogUrl: z.string().max(500).optional().nullable(),
  mapsUrl: z.string().max(500).optional().nullable(),
  customFAQ: z.string().max(20000).optional().nullable(),
  tone: z.enum(['santai', 'sopan', 'profesional', 'ramah']).default('sopan'),
  languageStyle: z.enum(['id', 'id-santai', 'id-en']).default('id'),
  botMode: z.enum(['auto_reply', 'faq_only', 'collect_and_handover']).default('auto_reply'),
  isBotActive: z.boolean().optional(),
});

// GET /api/bot-config — Get current user's bot config
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as unknown as { id: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const config = await prisma.businessBotConfig.findUnique({
    where: { userId },
    include: { template: true },
  });

  return NextResponse.json({ config });
}

// POST /api/bot-config — Create or update user's bot config
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as unknown as { id: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = botConfigSchema.parse(body);

    // Verify template exists and is active
    const template = await prisma.businessTemplate.findUnique({
      where: { id: data.templateId },
    });
    if (!template || !template.isActive) {
      return NextResponse.json({ error: 'Template tidak ditemukan atau tidak aktif' }, { status: 400 });
    }

    const config = await prisma.businessBotConfig.upsert({
      where: { userId },
      update: { ...data },
      create: { userId, ...data },
      include: { template: true },
    });

    return NextResponse.json({ config });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasi gagal', details: error.issues }, { status: 400 });
    }
    console.error('POST /api/bot-config error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
