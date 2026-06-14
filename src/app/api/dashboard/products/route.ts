import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveTenant } from '@/lib/tenant-isolation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const businessProfileId = searchParams.get('businessProfileId');

    if (!businessProfileId) {
      return NextResponse.json({ error: 'businessProfileId is required' }, { status: 400 });
    }

    // Verify ownership
    const profile = await prisma.businessProfile.findFirst({
      where: { id: businessProfileId, userId: user.id },
    });
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found or access denied' }, { status: 403 });
    }

    const products = await prisma.product.findMany({
      where: {
        businessProfileId,
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { businessProfileId, name, description, price, stock, isAvailable, category, imageUrl } = body;

    if (!businessProfileId || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const profile = await prisma.businessProfile.findFirst({
      where: { id: businessProfileId, userId: user.id },
    });
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found or access denied' }, { status: 403 });
    }

    const product = await prisma.product.create({
      data: {
        businessProfileId,
        name,
        description,
        price: price ? parseFloat(price) : 0,
        stock: stock ? parseInt(stock) : 0,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        category,
        imageUrl,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Products POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
