import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getMidtransSnap } from '@/lib/midtrans';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await req.json();
    if (!planId) {
      return NextResponse.json({ error: 'planId is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
    const plan = await prisma.plan.findUnique({ where: { id: planId } });

    if (!user || !plan) {
      return NextResponse.json({ error: 'User or Plan not found' }, { status: 404 });
    }

    // Create a pending transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        planId: plan.id,
        amount: plan.priceMonthly,
        status: 'pending',
        paymentProvider: 'midtrans',
      }
    });

    const midtransOrderId = `SUB-${transaction.id}`;
    
    const snap = await getMidtransSnap();

    // Request Snap token
    const parameter = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: plan.priceMonthly,
      },
      customer_details: {
        first_name: user.name || 'User',
        email: user.email || '',
      },
      item_details: [
        {
          id: plan.id,
          price: plan.priceMonthly,
          quantity: 1,
          name: `Langganan Paket ${plan.name} (30 Hari)`,
        }
      ]
    };

    const snapResponse = await snap.createTransaction(parameter);

    // Update transaction with externalId
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { externalId: midtransOrderId }
    });

    return NextResponse.json({ 
      token: snapResponse.token,
      redirect_url: snapResponse.redirect_url
    });

  } catch (error) {
    console.error('Midtrans Checkout Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
