import { NextResponse } from 'next/server';
import { getRequiredAdminOrResponse } from '@/lib/admin-helper';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';
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
    const admin = await getRequiredAdminOrResponse();    if (admin instanceof NextResponse) return admin;

    const body = await req.json();
    const parsed = updateWahaServerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.baseUrl) {
      updateData.baseUrl = parsed.data.baseUrl.replace(/\/$/, '');
    }
    if (parsed.data.apiKey) {
      updateData.apiKeyEncrypted = encrypt(parsed.data.apiKey);
      delete updateData.apiKey;
    }

    // @ts-ignore
    const server = await prisma.wahaServer.update({
      where: { id: (await params).id },
      data: updateData,
    });

    // @ts-ignore
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
    const admin = await getRequiredAdminOrResponse();    if (admin instanceof NextResponse) return admin;

    const serverId = (await params).id;
    
    // Check if server is in use
    // @ts-ignore
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

    // @ts-ignore
    await prisma.wahaServer.delete({
      where: { id: serverId },
    });

    // @ts-ignore
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
