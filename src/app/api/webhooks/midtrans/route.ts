import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { getMidtransConfig } from '@/lib/midtrans';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Verification
    const { serverKey } = await getMidtransConfig();
    const { order_id, status_code, gross_amount, signature_key, transaction_status } = body;

    const hash = crypto.createHash('sha512').update(`${order_id}${status_code}${gross_amount}${serverKey}`).digest('hex');
    
    if (hash !== signature_key) {
      return NextResponse.json({ error: 'Invalid Signature' }, { status: 401 });
    }

    const isSuccess = transaction_status === 'settlement' || transaction_status === 'capture';

    if (order_id.startsWith('SUB-')) {
      // --- B2B SaaS Subscription Payment ---
      const tx = await prisma.transaction.findUnique({ where: { externalId: order_id } });
      if (!tx) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });

      if (isSuccess && tx.status !== 'paid') {
        // Update Transaction
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { status: 'paid', paidAt: new Date() }
        });

        // Extend Subscription 30 Days
        const now = new Date();
        const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // + 30 days

        const existingSub = await prisma.subscription.findFirst({
          where: { userId: tx.userId, status: 'active' }
        });

        if (existingSub) {
          // Upgrade or extend
          await prisma.subscription.update({
            where: { id: existingSub.id },
            data: { planId: tx.planId, expiredAt: expiry }
          });
        } else {
          // Create new
          await prisma.subscription.create({
            data: {
              userId: tx.userId,
              planId: tx.planId,
              status: 'active',
              expiredAt: expiry
            }
          });
        }
      } else if (transaction_status === 'cancel' || transaction_status === 'expire' || transaction_status === 'deny') {
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { status: 'failed' }
        });
      }

    } else if (order_id.startsWith('ORD-')) {
      // --- B2C UMKM Order Payment ---
      const orderIdStr = order_id.replace('ORD-', '');
      const order = await prisma.order.findUnique({ where: { id: orderIdStr } });
      if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

      if (isSuccess && order.status !== 'paid') {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'paid' }
        });
      } else if (transaction_status === 'cancel' || transaction_status === 'expire' || transaction_status === 'deny') {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'cancelled' }
        });
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Midtrans Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
