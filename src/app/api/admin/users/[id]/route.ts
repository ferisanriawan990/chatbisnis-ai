import { NextResponse } from 'next/server';
import { getRequiredAdminOrResponse } from '@/lib/admin-helper';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateUserSchema = z.object({
  role: z.enum(['USER', 'ADMIN']),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getRequiredAdminOrResponse();    if (admin instanceof NextResponse) return admin;

    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const targetId = (await params).id;
    
    if (admin.id === targetId && parsed.data.role === 'USER') {
      return NextResponse.json({ error: 'Tidak dapat menurunkan role diri sendiri' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetId },
      data: { role: parsed.data.role },
    });

    // @ts-ignore - Phantom IDE error due to cached Prisma Client types
    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'UPDATE_USER_ROLE',
        entityType: 'User',
        entityId: (await params).id,
        metadataJson: JSON.stringify({ newRole: parsed.data.role })
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
