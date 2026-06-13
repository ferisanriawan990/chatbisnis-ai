import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BaileysService } from '@/lib/baileys';

// The cron job should run hourly. We will check orders that are stuck in certain statuses.
export async function GET(req: Request) {
  try {
    // 1. Validate Cron Secret (Mandatory for security)
    const authHeader = req.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET;
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    
    // Abandoned Cart: Status 'draft', created > 2 hours ago, < 24 hours ago, reminderSentAt is null
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const abandonedCarts = await prisma.order.findMany({
      where: {
        status: 'draft',
        createdAt: { lte: twoHoursAgo, gte: twentyFourHoursAgo },
        reminderSentAt: null
      },
      include: { businessProfile: { include: { chatbotSettings: true } } }
    });

    // Payment Reminders: Status 'pending_payment', updated > 24 hours ago, < 48 hours ago, reminderSentAt is null
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const pendingPayments = await prisma.order.findMany({
      where: {
        status: 'pending_payment',
        updatedAt: { lte: twentyFourHoursAgo, gte: fortyEightHoursAgo },
        reminderSentAt: null
      },
      include: { businessProfile: { include: { chatbotSettings: true } } }
    });
    // Appointment Reminders: Status not cancelled/completed, bookingDate between now and +24 hours, reminderSentAt is null
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        status: { in: ['pending', 'confirmed'] },
        bookingDate: { gte: now, lte: tomorrow },
        reminderSentAt: null
      },
      include: { businessProfile: { include: { chatbotSettings: true } } }
    });

    const results = { abandoned: 0, paymentReminders: 0, appointmentReminders: 0, errors: 0 };
    const ServiceClass = BaileysService;

    // Process Abandoned Carts
    for (const order of abandonedCarts) {
      try {
        const chatbotSetting = order.businessProfile.chatbotSettings.find(c => c.isActive);
        if (!chatbotSetting || !chatbotSetting.whatsappSessionName) continue;

        const { gateway } = await ServiceClass.resolveInstance(chatbotSetting.id);
        const name = order.customerName || 'Kak';
        const message = `Halo ${name}, kami perhatikan ada beberapa produk yang tertinggal di keranjang belanja Anda (Order #${order.orderNumber}).\n\nJika ada pertanyaan atau butuh bantuan untuk menyelesaikan pesanan, jangan ragu untuk membalas pesan ini ya! 😊`;

        await gateway.sendMessage(chatbotSetting.whatsappSessionName, order.customerPhone, message);
        await prisma.order.update({ where: { id: order.id }, data: { reminderSentAt: now } });
        results.abandoned++;
      } catch (e) {
        console.error(`Error sending abandoned cart reminder for order ${order.id}:`, e);
        results.errors++;
      }
    }

    // Process Payment Reminders
    for (const order of pendingPayments) {
      try {
        const chatbotSetting = order.businessProfile.chatbotSettings.find(c => c.isActive);
        if (!chatbotSetting || !chatbotSetting.whatsappSessionName) continue;

        const { gateway } = await ServiceClass.resolveInstance(chatbotSetting.id);
        const name = order.customerName || 'Kak';
        
        // Generate Invoice URL
        const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://chatbisnis-ai.vercel.app').replace(/\/$/, '');
        const invoiceUrl = `${appUrl}/pay/${order.id}`;

        const message = `Halo ${name}, ini pengingat ramah untuk pesanan #${order.orderNumber} Anda yang sedang menunggu pembayaran sebesar *Rp ${Number(order.totalAmount).toLocaleString('id-ID')}*.\n\nSilakan selesaikan pembayaran Anda melalui tautan berikut:\n${invoiceUrl}\n\nTerima kasih atas kepercayaannya! 🙏`;

        await gateway.sendMessage(chatbotSetting.whatsappSessionName, order.customerPhone, message);
        await prisma.order.update({ where: { id: order.id }, data: { reminderSentAt: now } });
        results.paymentReminders++;
      } catch (e) {
        console.error(`Error sending payment reminder for order ${order.id}:`, e);
        results.errors++;
      }
    }

    // Process Appointment Reminders
    for (const booking of upcomingBookings) {
      try {
        const chatbotSetting = booking.businessProfile.chatbotSettings.find(c => c.isActive);
        if (!chatbotSetting || !chatbotSetting.whatsappSessionName) continue;

        const { gateway } = await ServiceClass.resolveInstance(chatbotSetting.id);
        const name = booking.customerName || 'Kak';
        
        // Format Date and Time
        const dateStr = booking.bookingDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const timeStr = booking.bookingDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

        const message = `Halo ${name}, ini sekadar pengingat bahwa Anda memiliki jadwal untuk *${booking.serviceName}* besok pada hari *${dateStr}* jam *${timeStr}*.\n\nKami tunggu kedatangannya ya! Jika ingin membatalkan atau mengubah jadwal, silakan balas pesan ini. 🙏`;

        await gateway.sendMessage(chatbotSetting.whatsappSessionName, booking.customerPhone, message);
        await prisma.booking.update({ where: { id: booking.id }, data: { reminderSentAt: now } });
        results.appointmentReminders++;
      } catch (e) {
        console.error(`Error sending appointment reminder for booking ${booking.id}:`, e);
        results.errors++;
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('CRON Reminders Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
