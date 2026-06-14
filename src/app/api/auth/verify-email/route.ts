import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  try {
    const vt = await prisma.verificationToken.findUnique({
      where: { token }
    });

    if (!vt) {
      return NextResponse.json({ error: 'Token is invalid' }, { status: 400 });
    }

    if (vt.expires < new Date()) {
      return NextResponse.json({ error: 'Token has expired' }, { status: 400 });
    }

    await prisma.user.update({
      where: { email: vt.identifier },
      data: { emailVerified: new Date() }
    });

    await prisma.verificationToken.delete({
      where: { token }
    });

    return NextResponse.json({ success: true, message: 'Email berhasil diverifikasi! Silakan kembali ke halaman login.' });
  } catch (error) {
    console.error('Verify Email Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
