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

    // If turning ON, perform full validation checklist
    if (newStatus === true) {
      const missing: string[] = [];

      const profile = await prisma.businessProfile.findFirst({ where: { userId } });
      if (!profile || !profile.businessName?.trim() || !profile.businessIndustry?.trim()) {
        missing.push('Profil bisnis belum lengkap (businessName dan businessIndustry wajib diisi)');
      }

      // Knowledge base is now optional, as bots can function using just Templates and Business Profiles.

      const waSession = await prisma.whatsAppSession.findFirst({
        where: { userId, chatbotSettingId: chatbot.id },
      });
      if (!waSession || waSession.status !== 'connected') {
        missing.push('WhatsApp belum terhubung (status harus: connected)');
      }

      const subscription = await prisma.subscription.findUnique({
        where: { userId },
        include: { plan: true },
      });
      if (!subscription || subscription.status !== 'active' || !subscription.plan?.isActive) {
        missing.push('Tidak ada paket berlangganan yang aktif');
      }

      // Global AI key must exist AND be active
      const globalKey = await prisma.secretCredential.findUnique({
        where: { key: 'FLAZ_API_KEY_GLOBAL' },
      });
      const globalKeyActive = globalKey && globalKey.isActive === true;

      // Custom key is only valid if plan allows it AND key is configured
      const hasCustomKey =
        subscription?.plan?.allowCustomApiKey === true && !!chatbot.aiApiKeyEncrypted;

      if (!globalKeyActive && !hasCustomKey) {
        missing.push(
          'Global AI Key belum aktif dan Anda tidak memiliki AI Key custom yang valid',
        );
      }

      if (missing.length > 0) {
        return NextResponse.json(
          {
            error: 'Lengkapi setup terlebih dahulu sebelum mengaktifkan bot.',
            missing,
          },
          { status: 400 },
        );
      }
    }

    await prisma.chatbotSetting.update({
      where: { id: chatbot.id },
      data: { isActive: newStatus },
    });

    return NextResponse.json({ success: true, isActive: newStatus });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown';
    console.error('POST /api/dashboard/chatbot/toggle Error:', msg);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
