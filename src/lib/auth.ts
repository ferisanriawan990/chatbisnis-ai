import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

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
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email dan password wajib diisi');
        }

        const email = credentials.email.toLowerCase().trim();

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
