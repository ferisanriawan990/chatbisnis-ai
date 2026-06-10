import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WAHAService } from '@/lib/waha';
import { getActiveWahaSessionName, assertUserOwnsWahaSession } from '@/lib/waha-helpers';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const chatbot = await prisma.chatbotSetting.findFirst({
      where: { userId },
      include: { wahaServer: true },
    });

    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot setting tidak ditemukan' }, { status: 404 });
    }

    const activeSessionName = getActiveWahaSessionName(userId, chatbot.businessProfileId);

    if (!(await assertUserOwnsWahaSession(userId, activeSessionName))) {
       return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const wahaServer = chatbot.wahaServer;
    if (!wahaServer || !wahaServer.apiKeyEncrypted) {
      return NextResponse.json({ error: 'WAHA tidak dikonfigurasi' }, { status: 400 });
    }

    const waha = WAHAService.fromEncrypted(wahaServer.baseUrl, wahaServer.apiKeyEncrypted);
    const qrData = await waha.getQR(activeSessionName);

    return NextResponse.json({ qr: qrData });
  } catch (error) {
    console.error('GET /api/dashboard/waha/qr Error:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Gagal mengambil QR' }, { status: 500 });
  }
}
