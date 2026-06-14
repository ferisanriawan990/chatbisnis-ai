import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken, sendPasswordResetEmail } from '@/lib/email';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit(`forgot:${ip}`, 3, 60 * 1000);
    if (!rl.success) {
      return NextResponse.json({ error: 'Terlalu banyak percobaan. Coba lagi dalam 1 menit.' }, { status: 429 });
    }

    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user) {
      const token = generateToken();
      await prisma.passwordResetToken.create({
        data: {
          email: normalizedEmail,
          token,
          expires: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
        }
      });

      await sendPasswordResetEmail(normalizedEmail, token);
    }

    // Always return success even if user not found, to prevent email enumeration
    return NextResponse.json({ success: true, message: 'Jika email terdaftar, tautan pemulihan telah dikirim.' });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
