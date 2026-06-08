import { NextResponse } from 'next/server';
import { getRequiredAdminOrResponse, logAdminAction } from '@/lib/admin-helper';
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
    const admin = await getRequiredAdminOrResponse();
    if (admin instanceof NextResponse) return admin;
    if (admin instanceof NextResponse) return admin;
    if (admin instanceof NextResponse) return admin;

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
    const admin = await getRequiredAdminOrResponse();
    if (admin instanceof NextResponse) return admin;
    if (admin instanceof NextResponse) return admin;
    if (admin instanceof NextResponse) return admin;

    await prisma.wahaServer.delete({
      where: { id: (await params).id },
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
