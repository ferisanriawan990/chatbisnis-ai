import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertTenantAccess } from '@/lib/tenant-isolation';

export async function GET(req: Request, { params }: { params: { phone: string } }) {
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
        customerPhone: params.phone,
      },
      orderBy: { createdAt: 'asc' },
      take: 100, // Load latest 100
    });

    // Reset unread count
    await prisma.conversationState.updateMany({
      where: { businessProfileId: tenantId, customerPhone: params.phone },
      data: { unreadCount: 0 }
    });

    return NextResponse.json({ chatLogs });
  } catch (error) {
    console.error(`GET /api/dashboard/inbox/${params.phone} Error:`, (error as Error).message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { phone: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { tenantId, message, action } = body;

    if (!tenantId || (!message && action !== 'takeover' && action !== 'return')) {
      return NextResponse.json({ error: 'tenantId and message/action are required' }, { status: 400 });
    }

    const hasAccess = await assertTenantAccess(userId, tenantId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let convoState = await prisma.conversationState.findFirst({
      where: { businessProfileId: tenantId, customerPhone: params.phone }
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

    // Handle sending a message
    // 1. You should integrate this with your WhatsApp instance to actually push the message.
    // For now, we simulate the log.

    // Get ChatbotSetting to know which WhatsApp session
    const chatbotSetting = await prisma.chatbotSetting.findUnique({
      where: { id: convoState.chatbotSettingId }
    });

    if (chatbotSetting && chatbotSetting.whatsappSessionName) {
      const wahaUrl = process.env.WAHA_API_URL || 'http://localhost:3000';
      try {
        const payload: any = {
          session: chatbotSetting.whatsappSessionName,
          chatId: params.phone.includes('@') ? params.phone : `${params.phone}@c.us`,
          text: message
        };

        const wahaRes = await fetch(`${wahaUrl.replace(/\/$/, '')}/api/sendText`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        
        if (!wahaRes.ok) {
           console.error('Failed to send WhatsApp message', await wahaRes.text());
        }
      } catch (err) {
        console.error('Error calling WAHA:', err);
      }
    }

    // 2. Log it
    const log = await prisma.chatLog.create({
      data: {
        userId: chatbotSetting ? chatbotSetting.userId : userId,
        businessProfileId: tenantId,
        chatbotSettingId: convoState.chatbotSettingId,
        customerPhone: params.phone,
        messageIn: '',
        messageOut: `[Admin] ${message}`,
        status: 'success',
        metadataJson: JSON.stringify({ promptSource: 'admin' }),
      }
    });

    return NextResponse.json({ success: true, log });

  } catch (error) {
    console.error(`POST /api/dashboard/inbox/${params.phone} Error:`, (error as Error).message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
