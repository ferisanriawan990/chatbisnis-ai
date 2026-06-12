import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@chatbisnis.id' } });
    if (!adminUser) return NextResponse.json({ error: 'admin not found' });

    await prisma.chatbotSetting.updateMany({
      where: { userId: adminUser.id },
      data: { aiModel: 'gpt-4o-mini' }
    });

    return NextResponse.json({ success: true, aiModel: 'gpt-4o-mini' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
