import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-helper';
import { z } from 'zod/v4';

const templateSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100),
  category: z.string().min(1).max(100),
  description: z.string().max(2000),
  systemPrompt: z.string().min(10).max(10000),
  requiredFields: z.string(),
  sampleQuestions: z.string(),
  isActive: z.boolean().optional().default(true),
});

// GET /api/admin/templates — List all templates (admin only)
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const templates = await prisma.businessTemplate.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { botConfigs: true } } },
  });

  return NextResponse.json({ templates });
}

// POST /api/admin/templates — Create new template
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    const body = await req.json();
    const data = templateSchema.parse(body);

    // Check slug uniqueness
    const existing = await prisma.businessTemplate.findUnique({ where: { slug: data.slug } });
    if (existing) {
      return NextResponse.json({ error: 'Slug sudah digunakan' }, { status: 409 });
    }

    const template = await prisma.businessTemplate.create({ data });
    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasi gagal', details: error.issues }, { status: 400 });
    }
    console.error('POST /api/admin/templates error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
