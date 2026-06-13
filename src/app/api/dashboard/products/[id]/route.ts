import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, price, stock, isAvailable, category, imageUrl } = body;

    // Verify ownership indirectly by checking if product's business belongs to user
    const existing = await prisma.product.findUnique({
      where: { id: id },
      include: { businessProfile: true }
    });

    if (!existing || existing.businessProfile.userId !== user.id) {
      return NextResponse.json({ error: 'Product not found or access denied' }, { status: 403 });
    }

    const product = await prisma.product.update({
      where: { id: id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(category !== undefined && { category }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Products PUT error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.product.findUnique({
      where: { id: id },
      include: { businessProfile: true }
    });

    if (!existing || existing.businessProfile.userId !== user.id) {
      return NextResponse.json({ error: 'Product not found or access denied' }, { status: 403 });
    }

    await prisma.product.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Products DELETE error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
