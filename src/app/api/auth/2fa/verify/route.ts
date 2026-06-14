import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import speakeasy from 'speakeasy';
import { decrypt } from '@/lib/crypto';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code) {
      return NextResponse.json({ error: 'Kode OTP diperlukan' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
    if (!user || !user.twoFactorSecret) {
      return NextResponse.json({ error: 'Secret 2FA tidak ditemukan. Harap generate ulang QR.' }, { status: 400 });
    }

    let decryptedSecret: string;
    try {
      decryptedSecret = decrypt(user.twoFactorSecret);
    } catch {
      return NextResponse.json({ error: 'Secret 2FA rusak. Harap generate ulang QR.' }, { status: 400 });
    }

    if (!decryptedSecret) {
      return NextResponse.json({ error: 'Secret 2FA rusak. Harap generate ulang QR.' }, { status: 400 });
    }

    const verified = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token: code,
      window: 1 // Allow 1 window tolerance (30 seconds)
    });

    if (verified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorEnabled: true }
      });
      return NextResponse.json({ success: true, message: 'Autentikasi Dua Langkah berhasil diaktifkan!' });
    } else {
      return NextResponse.json({ error: 'Kode tidak valid. Coba lagi.' }, { status: 400 });
    }
  } catch (error) {
    console.error('2FA Verify Error:', error);
    return NextResponse.json({ error: 'Gagal memverifikasi kode OTP' }, { status: 500 });
  }
}
