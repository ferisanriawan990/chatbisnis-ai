import { NextResponse } from 'next/server';
import { getRequiredAdminOrResponse, validateAdminMutationOrigin } from '@/lib/admin-helper';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return handleSubscriptionUpdate(req, resolvedParams.id);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return handleSubscriptionUpdate(req, resolvedParams.id);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getRequiredAdminOrResponse();
    if (admin instanceof NextResponse) return admin;

    const resolvedParams = await params;
    const userId = resolvedParams.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await prisma.subscription.delete({
      where: { userId },
    });

    return NextResponse.json({ success: true, message: 'Subscription deleted successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    // If record doesn't exist, prisma throws an error on delete. Handle it:
    if (msg.includes('Record to delete does not exist')) {
      return NextResponse.json({ success: true, message: 'No subscription to delete' });
    }
    console.error('DELETE /api/admin/users/[id]/subscription Error:', msg);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function handleSubscriptionUpdate(req: Request, userId: string) {
  try {
    const admin = await getRequiredAdminOrResponse();
    if (admin instanceof NextResponse) return admin;

    const originError = validateAdminMutationOrigin(req);
    if (originError) return originError;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const body = await req.json();
    const { planId, status, startedAt, expiredAt } = body;

    if (!planId || !status) {
      return NextResponse.json({ error: 'planId and status are required' }, { status: 400 });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify plan exists
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const data = {
      planId,
      status,
      startedAt: startedAt ? new Date(startedAt) : new Date(),
      expiredAt: expiredAt ? new Date(expiredAt) : null,
    };

    const subscription = await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: data,
    });

    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('POST/PATCH /api/admin/users/[id]/subscription Error:', msg);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
