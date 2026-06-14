import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { decrypt } from './crypto';
import { rateLimit } from './rate-limit';

if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('NEXTAUTH_SECRET is required in production');
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
        totpCode: { label: '2FA Code', type: 'text' }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email dan password wajib diisi');
        }

        const email = credentials.email.toLowerCase().trim();
        
        // Anti-Brute Force Lockout
        const ip = req?.headers?.['x-forwarded-for']?.toString().split(',')[0] || req?.headers?.['x-real-ip']?.toString() || 'unknown';
        const rl = await rateLimit(`login:${email}:${ip}`, 5, 5 * 60 * 1000); // 5 attempts per 5 mins
        if (!rl.success) {
          throw new Error('Terlalu banyak percobaan login. Silakan coba lagi setelah 5 menit.');
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            businessProfiles: { select: { id: true, businessName: true } },
            userRoleAssignments: { select: { businessProfileId: true, role: { select: { name: true } } } }
          }
        });

        if (!user) {
          throw new Error('Email atau password salah');
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValid) {
          throw new Error('Email atau password salah');
        }

        // Phase 33: 2FA Check
        if (user.twoFactorEnabled && user.twoFactorSecret) {
          if (!credentials.totpCode) {
            throw new Error('2FA_REQUIRED');
          }
          let decryptedSecret: string;
          try {
            decryptedSecret = decrypt(user.twoFactorSecret);
          } catch {
            throw new Error('Konfigurasi 2FA rusak. Hubungi Admin.');
          }
          if (!decryptedSecret) {
            throw new Error('Konfigurasi 2FA rusak. Hubungi Admin.');
          }

          const speakeasy = require('speakeasy');
          const isTotpValid = speakeasy.totp.verify({
            secret: decryptedSecret,
            encoding: 'base32',
            token: credentials.totpCode,
            window: 1 // allow 1 window tolerance
          });

          if (!isTotpValid) {
            throw new Error('Kode 2FA tidak valid');
          }
        }

        // Map tenants and roles
        const tenants = user.businessProfiles.map(bp => {
          const roleAssignment = user.userRoleAssignments.find(r => r.businessProfileId === bp.id);
          return {
            id: bp.id,
            name: bp.businessName,
            role: roleAssignment?.role.name || 'owner'
          };
        });

        // Also add tenants where user is just staff (not owner)
        user.userRoleAssignments.forEach(assignment => {
          if (assignment.businessProfileId && !tenants.find(t => t.id === assignment.businessProfileId)) {
            tenants.push({
              id: assignment.businessProfileId,
              name: 'Assigned Business', // Ideally we fetch the name
              role: assignment.role.name
            });
          }
        });

        return { id: user.id, name: user.name, email: user.email, role: user.role, tenants };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.tenants = (user as any).tenants;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        const sessionUser = session.user as any;
        sessionUser.id = token.id;
        sessionUser.role = token.role;
        sessionUser.tenants = token.tenants || [];
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
};
