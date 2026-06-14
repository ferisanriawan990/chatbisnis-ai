import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getActiveTenant, assertTenantAccess } from '@/lib/tenant-isolation';
import { Prisma } from '@prisma/client';
import { z } from 'zod/v4';

const VALID_LEAD_STATUSES = ['cold', 'warm', 'hot', 'converted', 'lost'] as const;

const leadsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(VALID_LEAD_STATUSES).optional(),
  search: z.string().max(200).optional(),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parsed = leadsQuerySchema.safeParse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
    }

    const { page, limit, status, search } = parsed.data;
    const skip = (page - 1) * limit;
    const tenant = await getActiveTenant(req, session.user);
    if (!tenant) return NextResponse.json({ leads: [], pagination: { total: 0, page, limit, totalPages: 0 } });

    const where: Prisma.LeadWhereInput = { businessProfileId: tenant.id };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { customerPhone: { contains: search } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { interest: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [leads, totalCount] = await Promise.all([
      prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit, skip }),
      prisma.lead.count({ where }),
    ]);

    return NextResponse.json({
      leads,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown';
    console.error('GET /api/dashboard/leads Error:', msg);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

const updateLeadSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(VALID_LEAD_STATUSES).optional(),
  notes: z.string().optional().nullable(),
  assignedAdminId: z.string().uuid().optional().nullable(),
});

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const body = await req.json();
    const parsed = updateLeadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    const { id, status, notes, assignedAdminId } = parsed.data;

    // Verify lead belongs to user
    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const hasAccess = await assertTenantAccess(userId, existing.businessProfileId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        status: status !== undefined ? status : existing.status,
        notes: notes !== undefined ? notes : existing.notes,
        assignedAdminId: assignedAdminId !== undefined ? assignedAdminId : existing.assignedAdminId
      }
    });

    return NextResponse.json({ success: true, lead: updated });
  } catch (error) {
    console.error('PATCH /api/dashboard/leads Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
