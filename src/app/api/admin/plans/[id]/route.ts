import { NextResponse } from 'next/server';
import { getRequiredAdminOrResponse } from '@/lib/admin-helper';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updatePlanSchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  priceMonthly: z.coerce.number().min(0).optional(),
  maxWhatsappSessions: z.coerce.number().min(1).optional(),
  maxKnowledgeItems: z.coerce.number().min(1).optional(),
  dailyChatLimit: z.coerce.number().min(1).optional(),
  monthlyChatLimit: z.coerce.number().min(1).optional(),
  allowLeadCapture: z.boolean().optional(),
  allowHumanHandover: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getRequiredAdminOrResponse();    if (admin instanceof NextResponse) return admin;

    const body = await req.json();
    const parsed = updatePlanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const plan = await prisma.plan.update({
      where: { id: (await params).id },
      data: parsed.data,
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'UPDATE_PLAN',
        entityType: 'Plan',
        entityId: plan.id,
      }
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
