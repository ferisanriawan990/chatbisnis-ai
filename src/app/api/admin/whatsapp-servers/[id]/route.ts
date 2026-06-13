import { NextResponse } from 'next/server';
import { getRequiredAdminOrResponse, validateAdminMutationOrigin } from '@/lib/admin-helper';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';
import { Prisma } from '@prisma/client';
import { validatePublicHttpsUrl } from '@/lib/security';
import { z } from 'zod';

const updateWhatsappServerSchema = z.object({
  name: z.string().optional(),
  baseUrl: z.string().url().optional(),
  apiKey: z.string().optional(),
  maxSessions: z.coerce.number().min(1).optional(),
  isActive: z.boolean().optional(),
  notes: z.string().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const originError = validateAdminMutationOrigin(req);
    if (originError) return originError;

    const admin = await getRequiredAdminOrResponse();    if (admin instanceof NextResponse) return admin;

    const body = await req.json();
    const parsed = updateWhatsappServerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // SSRF protection (allowing HTTP for user's VPS)
    if (parsed.data.baseUrl) {
      try {
        const url = new URL(parsed.data.baseUrl);
        const hn = url.hostname;
        if (hn === 'localhost' || hn === '127.0.0.1' || hn === '0.0.0.0' || hn.startsWith('10.') || hn.startsWith('192.168.')) {
           return NextResponse.json({ error: 'URL WhatsApp Server tidak boleh menggunakan IP lokal (SSRF Protection).' }, { status: 400 });
        }
      } catch (e) {
        return NextResponse.json({ error: 'URL tidak valid' }, { status: 400 });
      }
    }

    const { apiKey, baseUrl, ...rest } = parsed.data;
    const updateData: Prisma.WhatsappServerUpdateInput = { ...rest };
    
    if (baseUrl) {
      updateData.baseUrl = baseUrl.replace(/\/$/, '');
    }
    if (apiKey) {
      updateData.apiKeyEncrypted = encrypt(apiKey);
    }

    const server = await prisma.whatsappServer.update({
      where: { id: (await params).id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'UPDATE_WHATSAPP_SERVER',
        entityType: 'WhatsappServer',
        entityId: server.id,
      }
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const originError = validateAdminMutationOrigin(req);
    if (originError) return originError;

    const admin = await getRequiredAdminOrResponse();
    if (admin instanceof NextResponse) return admin;

    const serverId = (await params).id;
    
    // Check if server is in use
    const server = await prisma.whatsappServer.findUnique({
      where: { id: serverId },
      include: {
        _count: {
          select: {
            chatbotSettings: true,
            whatsappSessions: true,
          }
        }
      }
    });

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    if (server.currentSessions > 0 || server._count.chatbotSettings > 0 || server._count.whatsappSessions > 0) {
      // Force unlink instead of blocking
      await prisma.whatsAppSession.updateMany({
        where: { whatsappServerId: serverId },
        data: { status: 'disconnected', whatsappServerId: null },
      });
      await prisma.chatbotSetting.updateMany({
        where: { whatsappServerId: serverId },
        data: { isActive: false, whatsappServerId: null },
      });
    }

    await prisma.whatsappServer.delete({
      where: { id: serverId },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'DELETE_WHATSAPP_SERVER',
        entityType: 'WhatsappServer',
        entityId: (await params).id,
      }
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
