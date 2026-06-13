import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod/v4';

const createSchema = z.object({
  title: z.string().min(1).max(100),
  shortcut: z.string().min(1).max(20),
  content: z.string().min(1)
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;
    const profile = await prisma.businessProfile.findFirst({ where: { userId } });
    if (!profile) return NextResponse.json({ replies: [] });

    const replies = await prisma.quickReply.findMany({
      where: { businessProfileId: profile.id },
      orderBy: { title: 'asc' }
    });

    return NextResponse.json({ replies });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;
    const profile = await prisma.businessProfile.findFirst({ where: { userId } });
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid data', details: parsed.error }, { status: 400 });

    const reply = await prisma.quickReply.create({
      data: {
        businessProfileId: profile.id,
        title: parsed.data.title,
        shortcut: parsed.data.shortcut.startsWith('/') ? parsed.data.shortcut : `/${parsed.data.shortcut}`,
        content: parsed.data.content
      }
    });

    return NextResponse.json({ success: true, reply });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const userId = (session.user as { id: string }).id;
    const profile = await prisma.businessProfile.findFirst({ where: { userId } });
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    await prisma.quickReply.deleteMany({
      where: { id, businessProfileId: profile.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
