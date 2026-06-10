import { NextResponse } from 'next/server';
import { getRequiredAdminOrResponse, validateAdminMutationOrigin } from '@/lib/admin-helper';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';
import { Prisma } from '@prisma/client';
import { validatePublicHttpsUrl } from '@/lib/security';
import { z } from 'zod';

const updateWahaServerSchema = z.object({
  name: z.string().optional(),
  baseUrl: z.string().url().optional(),
  apiKey: z.string().optional(),
  maxSessions: z.coerce.number().min(1).optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const originError = validateAdminMutationOrigin(req);
    if (originError) return originError;

    const admin = await getRequiredAdminOrResponse();    if (admin instanceof NextResponse) return admin;

    const body = await req.json();
    const parsed = updateWahaServerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    if (parsed.data.baseUrl && process.env.NODE_ENV === 'production' && !validatePublicHttpsUrl(parsed.data.baseUrl)) {
      return NextResponse.json({ error: 'URL WAHA Server harus HTTPS publik dan bukan IP lokal (SSRF Protection).' }, { status: 400 });
    }

    const { apiKey, baseUrl, ...rest } = parsed.data;
    const updateData: Prisma.WahaServerUpdateInput = { ...rest };
    
    if (baseUrl) {
      updateData.baseUrl = baseUrl.replace(/\/$/, '');
    }
    if (apiKey) {
      updateData.apiKeyEncrypted = encrypt(apiKey);
    }

    const server = await prisma.wahaServer.update({
      where: { id: (await params).id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'UPDATE_WAHA_SERVER',
        entityType: 'WahaServer',
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
    const server = await prisma.wahaServer.findUnique({
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
      return NextResponse.json({ 
        error: 'Cannot delete server because it is currently in use by one or more chatbots or sessions.' 
      }, { status: 409 });
    }

    await prisma.wahaServer.delete({
      where: { id: serverId },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'DELETE_WAHA_SERVER',
        entityType: 'WahaServer',
        entityId: (await params).id,
      }
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
