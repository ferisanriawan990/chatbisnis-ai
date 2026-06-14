import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        businessProfile: {
          select: { businessName: true }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    const safeOrder = {
      id: order.id,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt,
      customerName: order.customerName,
      customerPhone: order.customerPhone ? order.customerPhone.replace(/(\d{4})\d+(\d{2})/, '$1***$2') : null,
      items: order.items.map(item => ({
        productName: item.productName,
        quantity: item.quantity,
        price: item.price
      })),
      businessProfile: {
        businessName: order.businessProfile.businessName
      }
    };

    return NextResponse.json(safeOrder);
  } catch (error) {
    console.error('GET /api/pay/[orderId] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
