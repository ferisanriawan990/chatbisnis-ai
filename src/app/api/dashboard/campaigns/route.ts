import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertTenantAccess } from '@/lib/tenant-isolation';
import { logAudit } from '@/lib/audit-logger';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id;
    const chatbot = await prisma.chatbotSetting.findFirst({ where: { userId } });
    if (!chatbot) return NextResponse.json({ error: 'No chatbot config' }, { status: 400 });

    const hasAccess = await assertTenantAccess(userId, chatbot.businessProfileId);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const campaigns = await prisma.campaign.findMany({
      where: { businessProfileId: chatbot.businessProfileId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { targets: true }
        },
        targets: {
          select: { status: true }
        }
      }
    });

    const formatted = campaigns.map(c => {
      const pendingCount = c.targets.filter(t => t.status === 'PENDING').length;
      const sentCount = c.targets.filter(t => t.status === 'SENT').length;
      const failedCount = c.targets.filter(t => t.status === 'FAILED').length;
      const optOutCount = c.targets.filter(t => t.status === 'OPT_OUT').length;
      
      return {
        id: c.id,
        name: c.name,
        type: c.type,
        status: c.status,
        createdAt: c.createdAt,
        totalTargets: c._count.targets,
        pendingCount,
        sentCount,
        failedCount,
        optOutCount
      };
    });

    return NextResponse.json({ campaigns: formatted });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id;
    const { name, type, messageTemplate } = await req.json();

    if (!name || !type || !messageTemplate) {
      return NextResponse.json({ error: 'Harap isi semua kolom wajib' }, { status: 400 });
    }

    const chatbot = await prisma.chatbotSetting.findFirst({ where: { userId } });
    if (!chatbot) return NextResponse.json({ error: 'No chatbot config' }, { status: 400 });

    const hasAccess = await assertTenantAccess(userId, chatbot.businessProfileId);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Validate anti-spam placeholder
    const templateHasOptOut = messageTemplate.toLowerCase().includes('berhenti') || messageTemplate.toLowerCase().includes('stop');
    const finalTemplate = templateHasOptOut 
      ? messageTemplate 
      : `${messageTemplate}\n\n*Balas STOP untuk berhenti berlangganan promo.`;

    const campaign = await prisma.campaign.create({
      data: {
        businessProfileId: chatbot.businessProfileId,
        name,
        type,
        messageTemplate: finalTemplate,
        status: 'RUNNING' // Immediately run
      }
    });

    // If MANUAL, insert all non-opted-out leads immediately
    let targetCount = 0;
    if (type === 'MANUAL') {
      const activeLeads = await prisma.lead.findMany({
        where: { businessProfileId: chatbot.businessProfileId, isOptedOut: false },
        select: { id: true }
      });

      const targetsData = activeLeads.map(lead => ({
        campaignId: campaign.id,
        leadId: lead.id,
        status: 'PENDING' as any
      }));

      if (targetsData.length > 0) {
        const result = await prisma.campaignTarget.createMany({ data: targetsData });
        targetCount = result.count;
      }
    }

    await logAudit({
      actorUserId: userId,
      businessProfileId: chatbot.businessProfileId,
      action: 'CREATE_CAMPAIGN',
      entityType: 'Campaign',
      entityId: campaign.id,
      metadata: { type, targetCount }
    });

    return NextResponse.json({ success: true, campaignId: campaign.id, targetCount });
  } catch (error) {
    console.error('Create Campaign Error:', error);
    return NextResponse.json({ error: 'Gagal membuat kampanye' }, { status: 500 });
  }
}
