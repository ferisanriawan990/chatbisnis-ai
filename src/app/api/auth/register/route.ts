import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validations';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    // Rate limit: 3 requests per minute per IP
    const ip = getClientIp(req);
    const rl = rateLimit(`register:${ip}`, 3, 60 * 1000);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan. Coba lagi dalam 1 menit.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message);
      return NextResponse.json({ error: errors[0] }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already registered
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar. Silakan login.' },
        { status: 409 }
      );
    }

    // Hash password with cost 12
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'USER',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Akun berhasil dibuat. Silakan login.',
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('POST /api/auth/register Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server. Coba lagi nanti.' },
      { status: 500 }
    );
  }
}
