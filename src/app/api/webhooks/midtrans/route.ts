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
    const isFailure = transaction_status === 'cancel' || transaction_status === 'expire' || transaction_status === 'deny';

    if (order_id.startsWith('SUB-')) {
      // --- B2B SaaS Subscription Payment ---
      await prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.findUnique({ where: { externalId: order_id } });
        if (!transaction) throw new Error('Transaction not found');

        // Prevent backward status changes
        if (transaction.status === 'paid') return;

        if (isSuccess) {
          // Update Transaction
          await tx.transaction.update({
            where: { id: transaction.id },
            data: { status: 'paid', paidAt: new Date() }
          });

          // Find active subscription
          const existingSub = await tx.subscription.findFirst({
            where: { 
              userId: transaction.userId, 
              status: 'active',
              OR: [{ expiredAt: null }, { expiredAt: { gt: new Date() } }]
            }
          });

          const now = new Date();
          let baseDate = now;
          if (existingSub && existingSub.expiredAt && existingSub.expiredAt > now) {
            baseDate = existingSub.expiredAt;
          }
          
          const newExpiry = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000); // + 30 days

          if (existingSub) {
            // Upgrade or extend
            await tx.subscription.update({
              where: { id: existingSub.id },
              data: { planId: transaction.planId, expiredAt: newExpiry }
            });
          } else {
            // Create new
            await tx.subscription.create({
              data: {
                userId: transaction.userId,
                planId: transaction.planId,
                status: 'active',
                expiredAt: newExpiry
              }
            });
          }
        } else if (isFailure) {
          await tx.transaction.update({
            where: { id: transaction.id },
            data: { status: 'failed' }
          });
        }
      });

    } else if (order_id.startsWith('ORD-')) {
      // --- B2C UMKM Order Payment ---
      let orderIdStr = order_id.replace('ORD-', '');
      if (orderIdStr.length > 36) {
        orderIdStr = orderIdStr.substring(0, 36);
      }
      await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({ where: { id: orderIdStr } });
        if (!order) throw new Error('Order not found');

        // Prevent backward status changes
        if (order.status === 'paid' || order.status === 'completed') return;

        if (isSuccess) {
          await tx.order.update({
            where: { id: order.id },
            data: { status: 'paid' }
          });
        } else if (isFailure) {
          await tx.order.update({
            where: { id: order.id },
            data: { status: 'cancelled' }
          });
        }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Midtrans Webhook Error:', error.message);
    // Return 200 even on error if it's our logic error, so Midtrans stops retrying infinitely,
    // but return 500 if DB is down. For transaction missing, 404.
    if (error.message === 'Transaction not found' || error.message === 'Order not found') {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
