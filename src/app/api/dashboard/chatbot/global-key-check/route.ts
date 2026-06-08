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

    // Global AI key is only "available" when key exists AND isActive = true
    const globalKey = await prisma.secretCredential.findUnique({
      where: { key: 'FLAZ_API_KEY_GLOBAL' },
    });

    const hasGlobalKey = globalKey !== null && globalKey.isActive === true;

    return NextResponse.json({ hasGlobalKey });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
