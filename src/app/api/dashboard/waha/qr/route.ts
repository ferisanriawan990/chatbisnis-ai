import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WAHAService } from '@/lib/waha';

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

    // Read config from WahaServer relation
    const wahaServer = chatbot.wahaServer;
    const isCoreMode = process.env.WAHA_CORE_MODE === 'true';
    const activeSessionName = isCoreMode ? 'default' : chatbot.wahaSessionName;

    if (!wahaServer || !wahaServer.apiKeyEncrypted || !activeSessionName) {
      return NextResponse.json({ error: 'WAHA tidak dikonfigurasi' }, { status: 400 });
    }

    const waha = WAHAService.fromEncrypted(wahaServer.baseUrl, wahaServer.apiKeyEncrypted);
    const qrData = await waha.getQR(activeSessionName);

    return NextResponse.json({ qr: qrData });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown';
    console.error('GET /api/dashboard/waha/qr Error:', msg);
    return NextResponse.json({ error: 'Gagal mengambil QR' }, { status: 500 });
  }
}
