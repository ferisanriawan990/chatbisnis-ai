import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { encrypt } from '@/lib/crypto';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = speakeasy.generateSecret({
      name: `ChatBisnis AI (${session.user.email})`
    });

    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url!);

    // Save temporary encrypted secret to user (not yet enabled)
    await prisma.user.update({
      where: { id: (session.user as any).id },
      data: { twoFactorSecret: encrypt(secret.base32) }
    });

    return NextResponse.json({ secret: secret.base32, qrCodeDataUrl });
  } catch (error) {
    console.error('2FA Generate Error:', error);
    return NextResponse.json({ error: 'Gagal membuat QR Code 2FA' }, { status: 500 });
  }
}
