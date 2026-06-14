import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BaileysService } from '@/lib/baileys';
import { decrypt } from '@/lib/crypto';

export const maxDuration = 60; // 1 minute max duration
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch up to 10 PENDING targets whose campaign is RUNNING
    const targets = await prisma.campaignTarget.findMany({
      where: {
        status: 'PENDING',
        campaign: { status: 'RUNNING' }
      },
      take: 10,
      include: {
        campaign: true,
        lead: {
          include: {
            businessProfile: {
              include: {
                whatsappSessions: { where: { status: 'connected' } },
                chatbotSettings: { include: { whatsappServer: true } }
              }
            }
          }
        }
      }
    });

    if (targets.length === 0) {
      return NextResponse.json({ message: 'No pending campaign targets to process.' });
    }

    let successCount = 0;
    let failCount = 0;

    for (const target of targets) {
      // 2. Anti-spam Opt-Out check
      if (target.lead.isOptedOut) {
        await prisma.campaignTarget.update({
          where: { id: target.id },
          data: { status: 'OPT_OUT', errorReason: 'Lead has opted out' }
        });
        continue;
      }

      const profile = target.lead.businessProfile;
      const botConfig = profile.chatbotSettings[0];
      const session = profile.whatsappSessions[0];

      if (!botConfig || !botConfig.whatsappServer || !botConfig.whatsappServer.apiKeyEncrypted || !session) {
        await prisma.campaignTarget.update({
          where: { id: target.id },
          data: { status: 'FAILED', errorReason: 'No active WhatsApp session or server found' }
        });
        failCount++;
        continue;
      }

      try {
        const apiKey = decrypt(botConfig.whatsappServer.apiKeyEncrypted);
        const baileysService = BaileysService.fromConfig(botConfig.whatsappServer.baseUrl, apiKey);
        
        // 3. Simple template replacement
        const messageText = target.campaign.messageTemplate.replace(/\{\{name\}\}/gi, target.lead.customerName || 'Kak');

        // 4. Send Message via Baileys
        await baileysService.sendMessage(session.sessionName, target.lead.customerPhone, messageText);

        // 5. Update Status
        await prisma.campaignTarget.update({
          where: { id: target.id },
          data: { status: 'SENT', sentAt: new Date() }
        });

        successCount++;
        // Sleep 2 seconds between messages to simulate human typing and prevent WhatsApp ban
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        await prisma.campaignTarget.update({
          where: { id: target.id },
          data: { status: 'FAILED', errorReason: error.message || 'Unknown network error' }
        });
        failCount++;
      }
    }

    return NextResponse.json({ success: true, processed: targets.length, successCount, failCount });
  } catch (error) {
    console.error('Campaign Runner Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
