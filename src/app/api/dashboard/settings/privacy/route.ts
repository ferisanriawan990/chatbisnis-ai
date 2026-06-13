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

    const chatbot = await prisma.chatbotSetting.findFirst({
      where: { userId: (session.user as any).id },
      include: { businessProfile: { select: { chatRetentionDays: true } } }
    });
    
    if (!chatbot) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ chatRetentionDays: chatbot.businessProfile.chatRetentionDays });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { chatRetentionDays } = await req.json();

    const userId = (session.user as any).id;
    const chatbot = await prisma.chatbotSetting.findFirst({ where: { userId } });
    if (!chatbot) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const hasAccess = await assertTenantAccess(userId, chatbot.businessProfileId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.businessProfile.update({
      where: { id: chatbot.businessProfileId },
      data: { chatRetentionDays: Number(chatRetentionDays) || 0 }
    });

    await logAudit({
      actorUserId: userId, 
      businessProfileId: chatbot.businessProfileId, 
      action: 'UPDATE_RETENTION_POLICY', 
      entityType: 'BusinessProfile', 
      entityId: chatbot.businessProfileId, 
      metadata: { chatRetentionDays }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
