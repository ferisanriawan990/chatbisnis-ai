import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password || password.length < 8) {
      return NextResponse.json({ error: 'Token tidak valid atau password terlalu pendek' }, { status: 400 });
    }

    const prt = await prisma.passwordResetToken.findUnique({
      where: { token }
    });

    if (!prt || prt.expires < new Date()) {
      return NextResponse.json({ error: 'Token kedaluwarsa atau tidak valid' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { email: prt.email },
      data: { passwordHash }
    });

    await prisma.passwordResetToken.delete({
      where: { token }
    });

    return NextResponse.json({ success: true, message: 'Password berhasil direset. Silakan login.' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
