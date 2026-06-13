import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const profile = await prisma.businessProfile.findFirst({
      where: { userId },
      select: { id: true }
    });

    if (!profile) {
      return NextResponse.json({ testimonials: [], stats: { average: 0, count: 0 } });
    }

    const testimonials = await prisma.testimonial.findMany({
      where: { businessProfileId: profile.id },
      orderBy: { createdAt: 'desc' }
    });

    const count = testimonials.length;
    const average = count > 0 
      ? testimonials.reduce((acc, t) => acc + t.rating, 0) / count 
      : 0;

    return NextResponse.json({ 
      testimonials, 
      stats: { average: average.toFixed(1), count } 
    });
  } catch (error) {
    console.error('GET /api/dashboard/testimonials Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
