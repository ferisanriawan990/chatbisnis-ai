import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    const assignments = await prisma.userRoleAssignment.findMany({
      where: { userId: (session.user as any).id, businessProfileId: tenantId },
      include: { role: true },
    });
    if (assignments.length === 0) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const bookings = await prisma.booking.findMany({
      where: { businessProfileId: tenantId },
      orderBy: { bookingDate: 'asc' },
    });

    return NextResponse.json({ bookings });
  } catch (error: any) {
    console.error('Bookings Fetch Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify access
    const assignment = await prisma.userRoleAssignment.findFirst({
      where: { userId: (session.user as any).id, businessProfileId: booking.businessProfileId }
    });
    if (!assignment) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ booking: updated });
  } catch (error: any) {
    console.error('Bookings Update Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
