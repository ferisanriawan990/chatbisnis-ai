import { NextResponse } from 'next/server';
import { getRequiredAdminOrResponse } from '@/lib/admin-helper';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const admin = await getRequiredAdminOrResponse();
    if (admin instanceof NextResponse) return admin;
    const usage = await prisma.usageCounter.findMany({
      orderBy: { date: 'desc' },
      take: 100,
      include: {
        user: { select: { name: true, email: true } },
      }
    });

    return NextResponse.json(usage);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
