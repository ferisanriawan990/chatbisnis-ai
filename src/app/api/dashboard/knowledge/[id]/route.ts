import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertTenantAccess } from '@/lib/tenant-isolation';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id: sourceId } = await params;

    // Check if source exists
    const source = await prisma.knowledgeSource.findUnique({
      where: { id: sourceId }
    });

    if (!source) {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    }

    // Check access
    const hasAccess = await assertTenantAccess(userId, source.businessProfileId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete source (KnowledgeItem will be deleted via cascade if set up, or manually)
    // Prisma schema does not have onDelete Cascade on KnowledgeItem's sourceId, so we delete items first.
    await prisma.knowledgeItem.deleteMany({
      where: { sourceId }
    });

    await prisma.knowledgeSource.delete({
      where: { id: sourceId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/dashboard/knowledge Error:`, (error as Error).message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
