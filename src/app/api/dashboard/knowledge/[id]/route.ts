import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const source = await prisma.knowledgeSource.findFirst({
      where: { id, userId },
    });

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    // Prisma onDelete is set to SetNull for items, so we must delete them manually
    const deletedItems = await prisma.knowledgeItem.deleteMany({
      where: { sourceId: id, userId },
    });

    await prisma.knowledgeSource.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, deletedItemsCount: deletedItems.count });
  } catch (error) {
    console.error('DELETE /api/dashboard/knowledge/[id] Error:', (error as Error).message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
