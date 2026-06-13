import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod/v4';
import { BaileysService } from '@/lib/baileys';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const profile = await prisma.businessProfile.findFirst({
      where: { userId },
      select: { id: true }
    });

    if (!profile) {
      return NextResponse.json({ orders: [] });
    }

    // Build query
    const whereClause: any = { businessProfileId: profile.id };
    if (status && status !== 'all') {
      whereClause.status = status;
    }
    if (search) {
      whereClause.OR = [
        { orderNumber: { contains: search } },
        { customerName: { contains: search } },
        { customerPhone: { contains: search } }
      ];
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // limit to 50 for performance, could add pagination later
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('GET /api/dashboard/orders Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

const updateOrderSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['draft', 'pending_payment', 'paid', 'processing', 'shipped', 'completed', 'cancelled']),
  shippingCourier: z.string().max(100).optional().nullable(),
  shippingResi: z.string().max(100).optional().nullable(),
  shippingAddress: z.string().max(1000).optional().nullable()
});

export async function PATCH(req: Request) {
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

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    const body = await req.json();
    const parsed = updateOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input data', details: parsed.error.format() }, { status: 400 });
    }

    const data = parsed.data;

    // Verify ownership
    const existingOrder = await prisma.order.findFirst({
      where: { id: data.id, businessProfileId: profile.id }
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update Order
    const updated = await prisma.order.update({
      where: { id: data.id },
      data: {
        status: data.status,
        shippingCourier: data.shippingCourier !== undefined ? data.shippingCourier : existingOrder.shippingCourier,
        shippingResi: data.shippingResi !== undefined ? data.shippingResi : existingOrder.shippingResi,
        shippingAddress: data.shippingAddress !== undefined ? data.shippingAddress : existingOrder.shippingAddress
      }
    });

    // Trigger WhatsApp Review Collection if completed
    if (data.status === 'completed' && existingOrder.status !== 'completed') {
      
      // Phase 25: Loyalty Points Increment
      const pointsEarned = Math.floor(Number(existingOrder.totalAmount) / 1000);
      if (pointsEarned > 0) {
        const lead = await prisma.lead.findFirst({
          where: { businessProfileId: profile.id, customerPhone: existingOrder.customerPhone }
        });
        if (lead) {
          await prisma.lead.update({
            where: { id: lead.id },
            data: { loyaltyPoints: lead.loyaltyPoints + pointsEarned }
          });
        }
      }

      const chatbotSetting = await prisma.chatbotSetting.findFirst({
        where: { businessProfileId: profile.id }
      });

      if (chatbotSetting && chatbotSetting.whatsappSessionName && chatbotSetting.isActive) {
        const message = `Halo Kak ${existingOrder.customerName || ''}, pesanan *${existingOrder.orderNumber}* sudah selesai. Terima kasih telah berbelanja!\n\nSeberapa puas Anda dengan layanan/produk kami? Balas pesan ini dengan angka *1 (Kecewa)* hingga *5 (Sangat Puas)*, beserta ulasan singkatnya ya! Penilaian Anda sangat berarti bagi kami. 😊`;
        
        try {
          const { gateway } = await BaileysService.resolveInstance(chatbotSetting.id);
          await gateway.sendMessage(
            chatbotSetting.whatsappSessionName, 
            existingOrder.customerPhone, 
            message,
            `review-req:${existingOrder.id}`
          );
        } catch (e) {
          console.error('Failed to send automated review request:', e);
        }
      }
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error('PATCH /api/dashboard/orders Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
