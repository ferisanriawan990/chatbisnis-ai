import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ChatbotEngine } from '@/lib/chatbot-engine';

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as unknown as { id: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { message } = await req.json();
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Pesan tidak boleh kosong' }, { status: 400 });
    }

    // Get chatbot setting
    const chatbotSetting = await prisma.chatbotSetting.findFirst({
      where: { userId },
      include: { businessProfile: true }
    });

    if (!chatbotSetting) {
      return NextResponse.json({ error: 'Chatbot Setting belum dikonfigurasi.' }, { status: 400 });
    }

    // Get bot config to know the template name
    const config = await prisma.businessBotConfig.findUnique({
      where: { userId },
      include: { template: true },
    });

    // Call Chatbot Engine with isTest = true
    const reply = await ChatbotEngine.processMessage({
      whatsappSessionName: chatbotSetting.whatsappSessionName,
      customerPhone: '6280000000000', // Mock phone
      customerName: 'Test User',
      messageIn: message,
      isTest: true
    });

    return NextResponse.json({ 
      reply, 
      templateName: config?.template?.name || 'Legacy Config' 
    });
  } catch (error) {
    console.error('POST /api/chat/test error:', error);
    return NextResponse.json({ error: 'Gagal mengenerate respons AI' }, { status: 500 });
  }
}
