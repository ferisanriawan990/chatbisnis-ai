import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertTenantAccess } from '@/lib/tenant-isolation';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    // Verify access
    const hasAccess = await assertTenantAccess(userId, tenantId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get active conversations
    const conversations = await prisma.conversationState.findMany({
      where: { businessProfileId: tenantId },
      orderBy: { lastMessageAt: 'desc' },
      take: 50,
      include: {
        assignedAdmin: { select: { name: true } },
      }
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('GET /api/dashboard/inbox Error:', (error as Error).message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
