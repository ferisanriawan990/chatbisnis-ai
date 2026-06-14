import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validations';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { generateToken, sendVerificationEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    // Rate limit: 3 requests per minute per IP
    const ip = getClientIp(req);
    const rl = await rateLimit(`register:${ip}`, 3, 60 * 1000);
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

    // Get Free Plan
    let freePlan = await prisma.plan.findUnique({
      where: { slug: 'free' }
    });

    if (!freePlan) {
      console.log('Free plan not found, creating it automatically...');
      freePlan = await prisma.plan.create({
        data: {
          name: 'Free',
          slug: 'free',
          priceMonthly: 0,
          maxWhatsappSessions: 1,
          maxKnowledgeItems: 10,
          dailyChatLimit: 50,
          monthlyChatLimit: 1500,
          allowLeadCapture: false,
          allowHumanHandover: false,
          isActive: true
        }
      });
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'USER',
        emailVerified: new Date(), // Auto-verify untuk mempermudah login selama masa pengujian
        subscriptions: {
          create: {
            planId: freePlan.id,
            status: 'active',
            startedAt: new Date(),
            expiredAt: new Date(new Date().setFullYear(new Date().getFullYear() + 10)), // 10 years for free plan
          }
        }
      },
    });

    const token = generateToken();
    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      }
    });

    await sendVerificationEmail(normalizedEmail, token);

    return NextResponse.json({
      success: true,
      message: 'Akun berhasil dibuat. Silakan periksa email Anda untuk verifikasi.',
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error: any) {
    console.error('POST /api/auth/register Error:', error);
    return NextResponse.json(
      { error: process.env.NODE_ENV !== 'production' ? `Error: ${error.message}` : 'Terjadi kesalahan server. Coba lagi nanti.' },
      { status: 500 }
    );
  }
}
