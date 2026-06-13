import { NextResponse } from 'next/server';
import { getRequiredAdminOrResponse } from '@/lib/admin-helper';
import { prisma } from '@/lib/prisma';
import { WhatsappService } from '@/lib/whatsapp';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getRequiredAdminOrResponse();
    if (admin instanceof NextResponse) return admin;

    const serverId = (await params).id;
    const server = await prisma.whatsappServer.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    if (!server.apiKeyEncrypted) {
      return NextResponse.json({ error: 'API Key not configured for this server' }, { status: 400 });
    }

    try {
      const whatsapp = WhatsappService.fromEncrypted(server.baseUrl, server.apiKeyEncrypted);
      const isOk = await whatsapp.testConnection();
      
      if (!isOk) throw new Error('Cannot connect to server');
      
      await prisma.whatsappServer.update({
        where: { id: serverId },
        data: {
          status: 'online',
          lastHealthCheckAt: new Date(),
          lastError: null
        }
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Koneksi berhasil!', 
        status: isOk
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      await prisma.whatsappServer.update({
        where: { id: serverId },
        data: {
          status: 'offline',
          lastHealthCheckAt: new Date(),
          lastError: msg
        }
      });
      return NextResponse.json({ 
        success: false, 
        error: `Gagal terhubung ke WhatsApp Server: ${msg}` 
      }, { status: 500 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
