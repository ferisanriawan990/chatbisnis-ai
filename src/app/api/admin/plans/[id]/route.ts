import { NextResponse } from 'next/server';
import { getRequiredAdminOrResponse, validateAdminMutationOrigin } from '@/lib/admin-helper';
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

    const originError = validateAdminMutationOrigin(req);
    if (originError) return originError;

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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getRequiredAdminOrResponse();    
    if (admin instanceof NextResponse) return admin;

    const originError = validateAdminMutationOrigin(req);
    if (originError) return originError;

    const planId = (await params).id;

    // Prevent deleting the last plan or active plans if needed, but for now just delete
    const plan = await prisma.plan.delete({
      where: { id: planId },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'DELETE_PLAN',
        entityType: 'Plan',
        entityId: plan.id,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
