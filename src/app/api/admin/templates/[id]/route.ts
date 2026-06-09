import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-helper';
import { z } from 'zod/v4';

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
  systemPrompt: z.string().min(10).max(10000).optional(),
  requiredFields: z.string().optional(),
  sampleQuestions: z.string().optional(),
  isActive: z.boolean().optional(),
});

// PUT /api/admin/templates/[id]
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const template = await prisma.businessTemplate.update({
      where: { id },
      data,
    });

    return NextResponse.json({ template });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasi gagal', details: error.issues }, { status: 400 });
    }
    console.error('PUT /api/admin/templates/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/admin/templates/[id]
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;

  try {
    // Check if any bot configs use this template
    const configCount = await prisma.businessBotConfig.count({ where: { templateId: id } });
    if (configCount > 0) {
      return NextResponse.json(
        { error: `Template sedang digunakan oleh ${configCount} user. Nonaktifkan saja, jangan hapus.` },
        { status: 409 }
      );
    }

    await prisma.businessTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/admin/templates/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
