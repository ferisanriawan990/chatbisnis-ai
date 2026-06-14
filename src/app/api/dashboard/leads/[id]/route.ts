import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertTenantAccess } from '@/lib/tenant-isolation';
import { z } from 'zod/v4';

const patchLeadSchema = z.object({
  status: z.enum(['cold', 'warm', 'hot', 'converted', 'lost']).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { id } = await params;

    const body = await req.json();
    const parsed = patchLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid data' },
        { status: 400 },
      );
    }

    // Verify lead belongs to user via tenant access
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return NextResponse.json({ error: 'Lead tidak ditemukan' }, { status: 404 });
    }
    
    const hasAccess = await assertTenantAccess(userId, lead.businessProfileId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { status, notes } = parsed.data;

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json({ success: true, lead: updatedLead });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown';
    console.error('PATCH /api/dashboard/leads/[id] Error:', msg);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
