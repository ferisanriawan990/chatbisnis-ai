import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    await prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date() }
    });

    return NextResponse.json({ success: true, timestamp: new Date() });
  } catch (error) {
    console.error('Admin Ping Error:', error);
    return NextResponse.json({ error: 'Failed to ping admin status' }, { status: 500 });
  }
}
