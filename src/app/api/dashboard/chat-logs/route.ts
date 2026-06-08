import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

const VALID_STATUSES = ['success', 'failed'] as const;
type ChatLogStatus = (typeof VALID_STATUSES)[number];

function isValidStatus(s: string): s is ChatLogStatus {
  return VALID_STATUSES.includes(s as ChatLogStatus);
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const rawLimit = parseInt(searchParams.get('limit') || '20');
    const rawPage = parseInt(searchParams.get('page') || '1');
    const rawSearch = searchParams.get('search') || '';
    const rawStatus = searchParams.get('status') || '';
    const rawNeedsHuman = searchParams.get('needsHuman') || '';

    // Validated & clamped params
    const limit = Math.min(Math.max(rawLimit, 1), 100);
    const page = Math.max(rawPage, 1);
    const search = rawSearch.slice(0, 200);
    const skip = (page - 1) * limit;

    const userId = (session.user as { id: string }).id;

    const where: Prisma.ChatLogWhereInput = { userId };

    if (rawStatus && isValidStatus(rawStatus)) {
      where.status = rawStatus;
    }

    if (rawNeedsHuman === 'true') {
      where.needsHuman = true;
    } else if (rawNeedsHuman === 'false') {
      where.needsHuman = false;
    }

    if (search) {
      where.OR = [
        { customerPhone: { contains: search } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { messageIn: { contains: search, mode: 'insensitive' } },
        { messageOut: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [logs, totalCount] = await Promise.all([
      prisma.chatLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit, skip }),
      prisma.chatLog.count({ where }),
    ]);

    // Fetch conversation states for these logs
    const customerPhones = [...new Set(logs.map((l) => l.customerPhone))];
    const states = await prisma.conversationState.findMany({
      where: { userId, customerPhone: { in: customerPhones } },
    });

    const stateMap = states.reduce(
      (acc, curr) => {
        acc[curr.customerPhone] = curr.status;
        return acc;
      },
      {} as Record<string, string>,
    );

    return NextResponse.json({
      logs,
      states: stateMap,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown';
    console.error('GET /api/dashboard/chat-logs Error:', msg);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
