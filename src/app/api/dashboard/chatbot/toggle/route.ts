import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    const chatbot = await prisma.chatbotSetting.findFirst({ where: { userId } });
    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot setting tidak ditemukan' }, { status: 404 });
    }

    const newStatus = !chatbot.isActive;

    await prisma.chatbotSetting.update({
      where: { id: chatbot.id },
      data: { isActive: newStatus },
    });

    return NextResponse.json({ success: true, isActive: newStatus });
  } catch (error) {
    console.error('POST /api/dashboard/chatbot/toggle Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
