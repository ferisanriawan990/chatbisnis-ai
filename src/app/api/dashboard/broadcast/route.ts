import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getActiveTenant } from '@/lib/tenant-isolation';
import { z } from 'zod/v4';

const createCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  messageTemplate: z.string().min(5),
  targetTags: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const body = await req.json();
    const parsed = createCampaignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
    }

    const { name, messageTemplate, targetTags, imageUrl } = parsed.data;

    const tenant = await getActiveTenant(req, session.user);
    if (!tenant) return NextResponse.json({ error: 'Business profile not found' }, { status: 404 });
    const profile = { id: tenant.id };

    // Determine target leads
    const leadsWhere: any = { businessProfileId: profile.id };
    if (targetTags && targetTags.trim() !== '') {
      leadsWhere.tags = { contains: targetTags }; // very basic string contain search
    }

    const targetLeads = await prisma.lead.findMany({
      where: leadsWhere,
      select: { customerPhone: true, customerName: true }
    });

    if (targetLeads.length === 0) {
      return NextResponse.json({ error: 'No leads found matching the criteria' }, { status: 400 });
    }

    // Create Campaign
    const campaign = await prisma.broadcastCampaign.create({
      data: {
        businessProfileId: profile.id,
        name,
        messageTemplate,
        targetTags,
        imageUrl,
        status: 'processing',
      }
    });

    // Create Recipients
    await prisma.broadcastRecipient.createMany({
      data: targetLeads.map(lead => ({
        campaignId: campaign.id,
        customerPhone: lead.customerPhone,
        customerName: lead.customerName,
        status: 'pending'
      }))
    });

    // The actual sending is now handled in the background by broadcast-runner cron job.

    return NextResponse.json({ success: true, campaignId: campaign.id, targetCount: targetLeads.length });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown';
    console.error('POST /api/dashboard/broadcast Error:', msg);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const tenant = await getActiveTenant(req, session.user);
    if (!tenant) return NextResponse.json({ campaigns: [] });
    const profile = { id: tenant.id };

    const campaigns = await prisma.broadcastCampaign.findMany({
      where: { businessProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { recipients: true }
        }
      }
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
