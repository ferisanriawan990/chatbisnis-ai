import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BaileysService } from '@/lib/baileys';

export async function GET(req: Request) {
  try {
    // 1. Validate Cron Secret (Mandatory for security)
    const authHeader = req.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET;
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    // Generate start of day and end of day for today
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // Get all active business profiles
    const profiles = await prisma.businessProfile.findMany({
      include: {
        chatbotSettings: {
          where: { isActive: true }
        }
      }
    });

    const results = { totalReportsSent: 0, errors: 0 };

    for (const profile of profiles) {
      if (profile.chatbotSettings.length === 0) continue;
      const chatbotSetting = profile.chatbotSettings[0];
      if (!chatbotSetting.whatsappSessionName) continue;

      if (!profile.adminPhone) continue; // Needs an admin phone to receive the report

      try {
        // 1. Calculate New Leads today
        const newLeads = await prisma.lead.count({
          where: {
            businessProfileId: profile.id,
            createdAt: { gte: startOfDay, lte: endOfDay }
          }
        });

        // 2. Calculate Completed Orders & Revenue today
        const completedOrders = await prisma.order.findMany({
          where: {
            businessProfileId: profile.id,
            status: 'completed',
            updatedAt: { gte: startOfDay, lte: endOfDay }
          }
        });

        const totalRevenue = completedOrders.reduce((sum, order) => {
          return sum + (Number(order.totalAmount) || 0) + (Number(order.shippingFee) || 0) - (Number(order.discountAmount) || 0);
        }, 0);

        // 3. Calculate New Bookings today
        const newBookings = await prisma.booking.count({
          where: {
            businessProfileId: profile.id,
            createdAt: { gte: startOfDay, lte: endOfDay }
          }
        });

        // Skip sending if absolutely nothing happened today (optional, but good to reduce spam)
        if (newLeads === 0 && completedOrders.length === 0 && newBookings === 0) {
          continue;
        }

        // 4. Construct Report Message
        const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const message = `📊 *LAPORAN HARIAN BOT AI*\n🏢 Bisnis: ${profile.businessName}\n📅 Tanggal: ${dateStr}\n\nHalo Bos! Berikut adalah ringkasan performa bisnis hari ini:\n\n👥 *Pelanggan Baru (Leads):* ${newLeads} orang\n🛒 *Transaksi Sukses:* ${completedOrders.length} pesanan\n💰 *Total Omzet Hari Ini:* Rp ${totalRevenue.toLocaleString('id-ID')}\n📅 *Reservasi Baru:* ${newBookings} jadwal\n\nTetap semangat dan sukses selalu! 🚀\n_Pesan ini dikirim otomatis oleh ChatBisnis AI._`;

        // 5. Send WhatsApp Message
        const { gateway } = await BaileysService.resolveInstance(chatbotSetting.id);
        
        // Ensure adminPhone is in correct format
        let targetPhone = profile.adminPhone;
        if (targetPhone.startsWith('0')) targetPhone = '62' + targetPhone.substring(1);

        await gateway.sendMessage(chatbotSetting.whatsappSessionName, targetPhone, message);
        results.totalReportsSent++;

      } catch (err) {
        console.error(`Failed to send daily report for profile ${profile.id}:`, err);
        results.errors++;
      }
    }

    return NextResponse.json({ success: true, results });

  } catch (error) {
    console.error('CRON Daily Report Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
