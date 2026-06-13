import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { password } = await req.json();
    if (!password) {
      return NextResponse.json({ error: 'Password dibutuhkan untuk mematikan keamanan 2FA' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Password salah' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: (session.user as any).id },
      data: { twoFactorEnabled: false, twoFactorSecret: null }
    });

    return NextResponse.json({ success: true, message: 'Autentikasi Dua Langkah berhasil dimatikan.' });
  } catch (error) {
    console.error('2FA Disable Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem saat mematikan 2FA' }, { status: 500 });
  }
}
