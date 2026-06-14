import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: {
        name: true,
        email: true,
        avatar: true,
        twoFactorEnabled: true,
        createdAt: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get Profile Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

const updateProfileSchema = z.object({
  name: z.string().min(3, "Nama terlalu pendek").optional(),
  avatar: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "Password baru minimal 8 karakter").optional(),
});

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
    }

    const { name, avatar, currentPassword, newPassword } = parsed.data;
    const updateData: any = {};

    if (name) updateData.name = name;
    if (avatar !== undefined) updateData.avatar = avatar;

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Masukkan password saat ini untuk mengganti password baru' }, { status: 400 });
      }

      const currentUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!currentUser) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });

      const isValid = await bcrypt.compare(currentPassword, currentUser.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: 'Password saat ini salah' }, { status: 400 });
      }

      updateData.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Tidak ada data yang diubah' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        name: true,
        email: true,
        avatar: true,
      }
    });

    return NextResponse.json({ success: true, user: updatedUser, message: 'Profil berhasil diperbarui' });
  } catch (error) {
    console.error('Update Profile Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

