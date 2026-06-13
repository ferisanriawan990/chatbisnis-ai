import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const userId = (session.user as { id: string }).id;

    // Fetch the business profile ID from chatbot settings
    const chatbotSetting = await prisma.chatbotSetting.findFirst({
      where: { userId }
    });

    if (!chatbotSetting) return NextResponse.json([]);

    // Find all users who have a UserRoleAssignment for this business profile
    const assignments = await prisma.userRoleAssignment.findMany({
      where: { businessProfileId: chatbotSetting.businessProfileId },
      include: {
        user: { select: { id: true, name: true, email: true, createdAt: true } },
        role: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('GET /api/dashboard/team Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const userId = (session.user as { id: string }).id;
    const body = await req.json();
    const { name, email, password, roleName } = body;

    if (!name || !email || !password || !roleName) {
      return NextResponse.json({ error: 'Semua field harus diisi' }, { status: 400 });
    }

    const chatbotSetting = await prisma.chatbotSetting.findFirst({ where: { userId } });
    if (!chatbotSetting) return NextResponse.json({ error: 'Business Profile not found' }, { status: 404 });
    const businessProfileId = chatbotSetting.businessProfileId;

    // Check if user already exists
    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      // Check if already assigned
      const existingAssignment = await prisma.userRoleAssignment.findFirst({
        where: { userId: user.id, businessProfileId }
      });
      if (existingAssignment) {
        return NextResponse.json({ error: 'User ini sudah berada di dalam tim Anda' }, { status: 400 });
      }
    } else {
      // Create new user
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash: hashedPassword,
        }
      });
    }

    // Get or Create Role
    let role = await prisma.role.findFirst({ where: { name: roleName, businessProfileId } });
    if (!role) {
      role = await prisma.role.create({
        data: {
          name: roleName,
          description: `Peran ${roleName} khusus untuk toko ini`,
          businessProfileId,
          isSystem: false
        }
      });
    }

    // Assign Role
    const assignment = await prisma.userRoleAssignment.create({
      data: {
        userId: user.id,
        businessProfileId,
        roleId: role.id
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        role: { select: { name: true } }
      }
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error('POST /api/dashboard/team Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
