import { NextResponse } from 'next/server';
import { getRequiredAdminOrResponse, logAdminAction } from '@/lib/admin-helper';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const planSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  priceMonthly: z.coerce.number().min(0).default(0),
  maxWhatsappSessions: z.coerce.number().min(1).default(1),
  maxKnowledgeItems: z.coerce.number().min(1).default(50),
  dailyChatLimit: z.coerce.number().min(1).default(100),
  monthlyChatLimit: z.coerce.number().min(1).default(3000),
  allowN8nTemplates: z.boolean().default(false),
  allowLeadCapture: z.boolean().default(false),
  allowHumanHandover: z.boolean().default(false),
  allowCustomApiKey: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    const admin = await getRequiredAdminOrResponse();
    if (admin instanceof NextResponse) return admin;
    if (admin instanceof NextResponse) return admin;
    const plans = await prisma.plan.findMany({
      orderBy: { priceMonthly: 'asc' }
    });

    return NextResponse.json(plans);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getRequiredAdminOrResponse();
    if (admin instanceof NextResponse) return admin;
    if (admin instanceof NextResponse) return admin;
    if (admin instanceof NextResponse) return admin;

    const body = await req.json();
    const parsed = planSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const plan = await prisma.plan.create({
      data: parsed.data
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'CREATE_PLAN',
        entityType: 'Plan',
        entityId: plan.id,
      }
    });

    return NextResponse.json({ success: true, id: plan.id });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
