import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BaileysService } from '@/lib/baileys';
import { decrypt } from '@/lib/crypto';

export const maxDuration = 120; // 2 minutes max
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Find all leads that need follow up today or earlier, and are still pending
    const pendingLeads = await prisma.lead.findMany({
      where: {
        followUpDate: { lte: todayEnd },
        followUpStatus: 'pending'
      },
      include: {
        businessProfile: {
          include: {
            whatsappSessions: { where: { status: 'connected' } },
            chatbotSettings: { include: { whatsappServer: true } }
          }
        }
      }
    });

    if (pendingLeads.length === 0) {
      return NextResponse.json({ message: 'No pending follow-ups today.' });
    }

    // Group leads by businessProfile to send 1 summary message per admin
    const businessMap = new Map<string, any[]>();
    for (const lead of pendingLeads) {
      const bpId = lead.businessProfileId;
      if (!businessMap.has(bpId)) businessMap.set(bpId, []);
      businessMap.get(bpId)!.push(lead);
    }

    let successCount = 0;
    let failCount = 0;

    for (const [bpId, leads] of businessMap.entries()) {
      const profile = leads[0].businessProfile;
      const adminPhone = profile.adminPhone;
      const botConfig = profile.chatbotSettings[0];
      const session = profile.whatsappSessions[0];

      if (!adminPhone || !botConfig || !botConfig.whatsappServer || !botConfig.whatsappServer.apiKeyEncrypted || !session) {
        failCount++;
        continue;
      }

      try {
        const apiKey = decrypt(botConfig.whatsappServer.apiKeyEncrypted);
        const baileysService = BaileysService.fromConfig(botConfig.whatsappServer.baseUrl, apiKey);
        
        let messageText = `*PENGINGAT FOLLOW-UP SALES* 🔔\n\nHalo Admin, hari ini Anda memiliki ${leads.length} prospek yang harus segera di-follow-up:\n\n`;
        
        leads.forEach((l, idx) => {
          messageText += `${idx + 1}. *${l.customerName || 'Pelanggan'}* (${l.customerPhone})\n   Minat: ${l.interest || '-'}\n`;
        });
        
        messageText += `\nSilakan buka Dasbor ChatBisnis AI untuk menghubungi mereka sebelum prospek menjadi dingin! 🔥`;

        await baileysService.sendMessage(session.sessionName, adminPhone, messageText);
        successCount++;
        
        // Anti-ban delay
        await new Promise(r => setTimeout(r, 2000));
      } catch (error) {
        console.error('Follow up reminder error for profile:', bpId, error);
        failCount++;
      }
    }

    return NextResponse.json({ success: true, processedBusinesses: businessMap.size, successCount, failCount });
  } catch (error) {
    console.error('Sales Reminder Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
