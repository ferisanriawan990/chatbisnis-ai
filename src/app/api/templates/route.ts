import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/templates — Public list of active templates
export async function GET() {
  try {
    const templates = await prisma.businessTemplate.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        description: true,
        requiredFields: true,
        sampleQuestions: true,
        isActive: true,
        _count: { select: { botConfigs: true } },
      },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('GET /api/templates error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
