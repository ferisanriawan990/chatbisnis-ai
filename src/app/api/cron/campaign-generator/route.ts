import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const maxDuration = 300; // 5 mins
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDate = today.getDate();

    // 1. Process BIRTHDAY Campaigns
    const birthdayCampaigns = await prisma.campaign.findMany({
      where: { type: 'BIRTHDAY_AUTO', status: 'RUNNING' }
    });

    let generatedCount = 0;

    for (const campaign of birthdayCampaigns) {
      // Find leads whose birthday is today, not opted out, and haven't received this campaign this year
      // Prisma doesn't support extraction of Day/Month easily across different SQL dialects, 
      // so we fetch all leads with birthdays and filter in memory, or use raw SQL.
      // For simplicity and safety, we fetch leads with birthDate != null for this business.
      
      const leads = await prisma.lead.findMany({
        where: { businessProfileId: campaign.businessProfileId, isOptedOut: false, birthDate: { not: null } }
      });

      for (const lead of leads) {
        if (!lead.birthDate) continue;
        if (lead.birthDate.getMonth() + 1 === todayMonth && lead.birthDate.getDate() === todayDate) {
          // Check if already sent today/this year
          const existingTarget = await prisma.campaignTarget.findFirst({
            where: {
              campaignId: campaign.id,
              leadId: lead.id,
              createdAt: { gte: new Date(today.getFullYear(), 0, 1) } // sent this year
            }
          });

          if (!existingTarget) {
            await prisma.campaignTarget.create({
              data: { campaignId: campaign.id, leadId: lead.id }
            });
            generatedCount++;
          }
        }
      }
    }

    // 2. Process RETARGETING Campaigns
    const retargetingCampaigns = await prisma.campaign.findMany({
      where: { type: 'RETARGETING_AUTO', status: 'RUNNING' }
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const campaign of retargetingCampaigns) {
      const passiveLeads = await prisma.lead.findMany({
        where: { 
          businessProfileId: campaign.businessProfileId, 
          isOptedOut: false, 
          lastActiveAt: { lt: thirtyDaysAgo } 
        }
      });

      for (const lead of passiveLeads) {
        // Prevent spamming retargeting: check if they received this campaign recently (e.g. last 30 days)
        const recentTarget = await prisma.campaignTarget.findFirst({
          where: {
            campaignId: campaign.id,
            leadId: lead.id,
            createdAt: { gte: thirtyDaysAgo }
          }
        });

        if (!recentTarget) {
          await prisma.campaignTarget.create({
            data: { campaignId: campaign.id, leadId: lead.id }
          });
          generatedCount++;
        }
      }
    }

    return NextResponse.json({ success: true, targetsGenerated: generatedCount });
  } catch (error) {
    console.error('Campaign Generator Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
