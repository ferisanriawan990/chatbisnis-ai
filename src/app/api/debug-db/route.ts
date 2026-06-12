import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const settings = await prisma.chatbotSetting.findMany({
    select: {
      id: true,
      wahaSessionName: true,
      aiApiKeyEncrypted: true,
      isActive: true,
      aiProvider: true,
      aiModel: true,
      user: { select: { email: true } }
    }
  });

  return NextResponse.json({
    databaseUrl: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + "..." : "missing",
    settings
  });
}
