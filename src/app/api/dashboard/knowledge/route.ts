import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    const sources = await prisma.knowledgeSource.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        knowledgeItems: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return NextResponse.json({ sources });
  } catch (error) {
    console.error('GET /api/dashboard/knowledge Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
