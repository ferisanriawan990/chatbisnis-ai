import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BaileysService } from '@/lib/baileys';
import { secureFetchBuffer } from '@/lib/security-fetch';

export const maxDuration = 60; // 1 minute max duration
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ambil maksimal 10 target broadcast yang masih PENDING dari campaign yang masih PROCESSING
    const recipients = await prisma.broadcastRecipient.findMany({
      where: {
        status: 'pending',
        campaign: { status: 'processing' }
      },
      take: 10,
      include: {
        campaign: {
          include: {
            businessProfile: {
              include: { chatbotSettings: true }
            }
          }
        }
      }
    });

    if (recipients.length === 0) {
      // Check if there are any processing campaigns that have NO pending recipients
      const finishedCampaigns = await prisma.broadcastCampaign.findMany({
        where: {
          status: 'processing',
          recipients: { none: { status: 'pending' } }
        }
      });
      for (const fc of finishedCampaigns) {
        await prisma.broadcastCampaign.update({
          where: { id: fc.id },
          data: { status: 'completed', completedAt: new Date() }
        });
      }
      return NextResponse.json({ message: 'No pending broadcast recipients to process.' });
    }

    let successCount = 0;
    let failCount = 0;

    for (const recipient of recipients) {
      const campaign = recipient.campaign;
      const chatbot = campaign.businessProfile.chatbotSettings.find(c => c.isActive);

      if (!chatbot) {
        await prisma.broadcastRecipient.update({
          where: { id: recipient.id },
          data: { status: 'failed', errorMessage: 'No active chatbot setting found' }
        });
        failCount++;
        continue;
      }

      try {
        const { gateway } = await BaileysService.resolveInstance(chatbot.id);

        let msg = campaign.messageTemplate;
        if (recipient.customerName) {
          msg = msg.replace(/\[Nama\]/gi, recipient.customerName);
        } else {
          msg = msg.replace(/\[Nama\]/gi, 'Kak');
        }

        const jid = recipient.customerPhone.includes('@') ? recipient.customerPhone : `${recipient.customerPhone}@s.whatsapp.net`;

        if (campaign.imageUrl) {
          try {
            const { buffer, contentType } = await secureFetchBuffer(campaign.imageUrl, {
              maxSizeBytes: 5 * 1024 * 1024,
              signal: AbortSignal.timeout(10000)
            });
            const base64 = buffer.toString('base64');
            await gateway.sendImageBase64(chatbot.whatsappSessionName, jid, contentType, base64, msg);
          } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error('Failed to fetch or send image securely:', err.message);
            await gateway.sendMessage(chatbot.whatsappSessionName, jid, msg);
          }
        } else {
          await gateway.sendMessage(chatbot.whatsappSessionName, jid, msg);
        }

        await prisma.broadcastRecipient.update({
          where: { id: recipient.id },
          data: { status: 'sent', sentAt: new Date() }
        });
        successCount++;
        
      } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        await prisma.broadcastRecipient.update({
          where: { id: recipient.id },
          data: { status: 'failed', errorMessage: err.message || 'Unknown error' }
        });
        failCount++;
      }

      // 2 detik jeda agar tidak spam
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return NextResponse.json({ success: true, processed: recipients.length, successCount, failCount });

  } catch (error) {
    console.error('Broadcast Runner Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
