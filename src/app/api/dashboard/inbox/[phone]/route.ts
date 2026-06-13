import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertTenantAccess } from '@/lib/tenant-isolation';

export async function GET(req: Request, { params }: { params: Promise<{ phone: string }> }) {
  const resolvedParams = await params;
  const phone = resolvedParams.phone;
  try {

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    // Verify access
    const hasAccess = await assertTenantAccess(userId, tenantId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find the Chatbot Setting for this tenant to filter logs correctly
    const chatbotSetting = await prisma.chatbotSetting.findFirst({
      where: { businessProfileId: tenantId }
    });

    if (!chatbotSetting) {
      return NextResponse.json({ error: 'Chatbot Setting not found for this tenant' }, { status: 404 });
    }

    const chatLogs = await prisma.chatLog.findMany({
      where: {
        businessProfileId: tenantId,
        customerPhone: phone,
      },
      orderBy: { createdAt: 'asc' },
      take: 100, // Load latest 100
    });

    // Reset unread count
    await prisma.conversationState.updateMany({
      where: { businessProfileId: tenantId, customerPhone: phone },
      data: { unreadCount: 0 }
    });

    return NextResponse.json({ chatLogs });
  } catch (error) {
    console.error(`GET /api/dashboard/inbox/${phone} Error:`, (error as Error).message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ phone: string }> }) {
  const resolvedParams = await params;
  const phone = resolvedParams.phone;
  try {
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { tenantId, message, action } = body;

    if (!tenantId || (!message && action !== 'takeover' && action !== 'return' && action !== 'assign')) {
      return NextResponse.json({ error: 'tenantId and message/action are required' }, { status: 400 });
    }

    const hasAccess = await assertTenantAccess(userId, tenantId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let convoState = await prisma.conversationState.findFirst({
      where: { businessProfileId: tenantId, customerPhone: phone }
    });

    if (!convoState) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Handle Takeover or Return Actions
    if (action === 'takeover') {
      const until = new Date();
      until.setHours(until.getHours() + 24);
      convoState = await prisma.conversationState.update({
        where: { id: convoState.id },
        data: { status: 'human_handover', handoverUntil: until, assignedAdminId: userId }
      });
      return NextResponse.json({ success: true, convoState });
    }

    if (action === 'return') {
      convoState = await prisma.conversationState.update({
        where: { id: convoState.id },
        data: { status: 'ai_active', handoverUntil: null, assignedAdminId: null }
      });
      return NextResponse.json({ success: true, convoState });
    }

    // Handle Assign Action
    if (action === 'assign') {
      const { assignedAdminId } = body;
      convoState = await prisma.conversationState.update({
        where: { id: convoState.id },
        data: { assignedAdminId: assignedAdminId || null }
      });
      return NextResponse.json({ success: true, convoState });
    }

    // Handle sending a message
    const chatbotSetting = await prisma.chatbotSetting.findUnique({
      where: { id: convoState.chatbotSettingId }
    });

    if (chatbotSetting && chatbotSetting.whatsappSessionName) {
      try {
        const { BaileysService } = await import('@/lib/baileys');
        const resolved = await BaileysService.resolveInstance(chatbotSetting.id);
        const gateway = resolved.gateway;

        await gateway.sendMessage(
          chatbotSetting.whatsappSessionName,
          phone,
          message
        );
        
        // Auto-takeover when admin replies
        if (convoState.status !== 'human_handover') {
          const until = new Date();
          until.setHours(until.getHours() + 24);
          await prisma.conversationState.update({
            where: { id: convoState.id },
            data: { status: 'human_handover', handoverUntil: until, assignedAdminId: userId }
          });
        }
      } catch (err) {
        console.error('Error calling WhatsApp gateway:', err);
        return NextResponse.json({ error: 'Failed to send WhatsApp message' }, { status: 500 });
      }
    }

    // 2. Log it
    const log = await prisma.chatLog.create({
      data: {
        userId: chatbotSetting ? chatbotSetting.userId : userId,
        businessProfileId: tenantId,
        chatbotSettingId: convoState.chatbotSettingId,
        customerPhone: phone,
        messageIn: '',
        messageOut: `[Admin] ${message}`,
        status: 'success',
        metadataJson: JSON.stringify({ promptSource: 'admin' }),
      }
    });

    return NextResponse.json({ success: true, log });

  } catch (error) {
    console.error(`POST /api/dashboard/inbox/${phone} Error:`, (error as Error).message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
