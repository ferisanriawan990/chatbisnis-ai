import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ChatbotEngine } from '@/lib/chatbot-engine';

export async function GET() {
  try {
    const chatbot = await prisma.chatbotSetting.findFirst({ where: { isActive: true } });
    if (!chatbot) return NextResponse.json({ error: "No active chatbot" });
    
    let internalError = "None";
    const originalError = console.error;
    console.error = (...args) => {
        const msg = args.join(' ');
        if (msg.includes('ChatbotEngine final error') || msg.includes('Failed to decrypt')) {
            internalError += " | " + msg;
        }
        originalError(...args);
    };

    const res = await ChatbotEngine.processMessage({
      wahaSessionName: chatbot.wahaSessionName,
      customerPhone: '123456@lid',
      messageIn: 'halo'
    });
    
    console.error = originalError;

    return NextResponse.json({ result: res, internalError });
  } catch (e: any) {
    return NextResponse.json({ crash: e.message });
  }
}
