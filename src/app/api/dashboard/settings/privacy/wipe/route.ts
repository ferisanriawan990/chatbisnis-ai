import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertTenantAccess } from '@/lib/tenant-isolation';
import { logAudit } from '@/lib/audit-logger';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { confirmationText } = await req.json();
    if (confirmationText !== 'HAPUS PERMANEN') {
      return NextResponse.json({ error: 'Teks konfirmasi tidak cocok' }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const chatbot = await prisma.chatbotSetting.findFirst({ where: { userId } });
    
    if (!chatbot) {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 400 });
    }

    // Must be admin
    const hasAccess = await assertTenantAccess(userId, chatbot.businessProfileId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Wipe Chat Logs
    const result = await prisma.chatLog.deleteMany({
      where: { businessProfileId: chatbot.businessProfileId }
    });

    await logAudit({
      actorUserId: userId, 
      businessProfileId: chatbot.businessProfileId, 
      action: 'WIPE_ALL_CHAT_LOGS', 
      entityType: 'BusinessProfile', 
      entityId: chatbot.businessProfileId, 
      metadata: { deletedCount: result.count }
    });

    return NextResponse.json({ success: true, message: `Berhasil menghapus permanen ${result.count} data chat log.` });
  } catch (error) {
    console.error('Wipe Data Error:', error);
    return NextResponse.json({ error: 'Gagal menghapus data' }, { status: 500 });
  }
}
