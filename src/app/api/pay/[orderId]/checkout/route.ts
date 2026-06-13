import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { snap } from '@/lib/midtrans';

export async function POST(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status === 'paid' || order.status === 'completed' || order.status === 'shipped') {
      return NextResponse.json({ error: 'Pesanan sudah dibayar atau diproses.' }, { status: 400 });
    }

    const grossAmount = Math.round(Number(order.totalAmount) + Number(order.shippingFee) - Number(order.discountAmount));
    const midtransOrderId = `ORD-${order.id}`;

    // Request Snap token
    const parameter = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: grossAmount,
      },
      customer_details: {
        first_name: order.customerName || 'Pelanggan',
        phone: order.customerPhone || '',
        shipping_address: {
          address: order.shippingAddress || '',
        }
      },
      item_details: order.items.map(item => ({
        id: item.id,
        price: Math.round(Number(item.price)),
        quantity: item.quantity,
        name: item.productName.substring(0, 50),
      }))
    };

    // Add shipping fee if present
    if (Number(order.shippingFee) > 0) {
      parameter.item_details.push({
        id: 'SHIPPING',
        price: Math.round(Number(order.shippingFee)),
        quantity: 1,
        name: 'Biaya Pengiriman',
      });
    }

    // Add discount if present
    if (Number(order.discountAmount) > 0) {
      parameter.item_details.push({
        id: 'DISCOUNT',
        price: -Math.round(Number(order.discountAmount)),
        quantity: 1,
        name: 'Diskon/Voucher',
      });
    }

    const snapResponse = await snap.createTransaction(parameter);

    // Update order status to pending_payment if it was draft
    if (order.status === 'draft') {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'pending_payment' }
      });
    }

    return NextResponse.json({ 
      token: snapResponse.token,
      redirect_url: snapResponse.redirect_url
    });

  } catch (error) {
    console.error('Midtrans B2C Checkout Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
