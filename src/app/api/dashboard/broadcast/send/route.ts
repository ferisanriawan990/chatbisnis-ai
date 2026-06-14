import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BaileysService } from '@/lib/baileys';
import { secureFetchBuffer } from '@/lib/security-fetch';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const campaignId = body.campaignId;
    const triggerSecret = req.headers.get('x-internal-trigger-secret');

    if (triggerSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized internal worker call' }, { status: 401 });
    }

    if (!campaignId) return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 });

    const campaign = await prisma.broadcastCampaign.findUnique({
      where: { id: campaignId },
      include: {
        businessProfile: {
          include: { chatbotSettings: true }
        }
      }
    });

    if (!campaign || campaign.status !== 'processing') {
      return NextResponse.json({ error: 'Campaign not found or not in processing state' });
    }

    const chatbot = campaign.businessProfile.chatbotSettings.find(c => c.isActive);
    if (!chatbot) {
      await prisma.broadcastCampaign.update({ where: { id: campaign.id }, data: { status: 'failed' } });
      return NextResponse.json({ error: 'No active chatbot setting found for business' });
    }

    const recipients = await prisma.broadcastRecipient.findMany({
      where: { campaignId: campaign.id, status: 'pending' }
    });

    if (recipients.length === 0) {
      await prisma.broadcastCampaign.update({ where: { id: campaign.id }, data: { status: 'completed', completedAt: new Date() } });
      return NextResponse.json({ success: true, message: 'All recipients processed' });
    }

    const { gateway } = await BaileysService.resolveInstance(chatbot.id);

    // Process recipients
    for (const recipient of recipients) {
      try {
        let msg = campaign.messageTemplate;
        // Personalization
        if (recipient.customerName) {
          msg = msg.replace(/\[Nama\]/gi, recipient.customerName);
        } else {
          msg = msg.replace(/\[Nama\]/gi, 'Kak');
        }

        const jid = recipient.customerPhone.includes('@') ? recipient.customerPhone : `${recipient.customerPhone}@s.whatsapp.net`;

          if (campaign.imageUrl) {
            try {
              const { buffer, contentType } = await secureFetchBuffer(campaign.imageUrl, {
                maxSizeBytes: 5 * 1024 * 1024, // 5MB max for broadcast image
                signal: AbortSignal.timeout(10000)
              });
              const base64 = buffer.toString('base64');
              await gateway.sendImageBase64(chatbot.whatsappSessionName, jid, contentType, base64, msg);
            } catch (err: any) {
              console.error('Failed to fetch or send image securely:', err.message);
              // fallback to text if SSRF detected or invalid URL or too large
              await gateway.sendMessage(chatbot.whatsappSessionName, jid, msg);
            }
          } else {
          await gateway.sendMessage(chatbot.whatsappSessionName, jid, msg);
        }

        await prisma.broadcastRecipient.update({
          where: { id: recipient.id },
          data: { status: 'sent', sentAt: new Date() }
        });

      } catch (err: any) {
        await prisma.broadcastRecipient.update({
          where: { id: recipient.id },
          data: { status: 'failed', errorMessage: err.message || 'Unknown error' }
        });
      }

      // Add a 1-second delay to avoid spamming the gateway
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await prisma.broadcastCampaign.update({ where: { id: campaign.id }, data: { status: 'completed', completedAt: new Date() } });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('POST /api/dashboard/broadcast/send Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
