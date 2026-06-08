import { NextResponse } from 'next/server';
import { getRequiredAdminOrResponse } from '@/lib/admin-helper';
import { prisma } from '@/lib/prisma';
import { WAHAService } from '@/lib/waha';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getRequiredAdminOrResponse();
    if (admin instanceof NextResponse) return admin;

    const serverId = (await params).id;
    // @ts-ignore
    const server = await prisma.wahaServer.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    if (!server.apiKeyEncrypted) {
      return NextResponse.json({ error: 'API Key not configured for this server' }, { status: 400 });
    }

    try {
      const waha = WAHAService.fromEncrypted(server.baseUrl, server.apiKeyEncrypted);
      const isOk = await waha.testConnection();
      
      if (!isOk) throw new Error('Cannot connect to server');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Koneksi berhasil!', 
        status: isOk
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json({ 
        success: false, 
        error: `Gagal terhubung ke WAHA Server: ${msg}` 
      }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
