import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const maxDuration = 300; // Allow 5 minutes max duration for heavy deletion

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find businesses with retention > 0
    const businesses = await prisma.businessProfile.findMany({
      where: { chatRetentionDays: { gt: 0 } },
      select: { id: true, chatRetentionDays: true }
    });

    let totalDeleted = 0;

    for (const business of businesses) {
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - business.chatRetentionDays);

      const result = await prisma.chatLog.deleteMany({
        where: {
          businessProfileId: business.id,
          createdAt: { lt: retentionDate }
        }
      });

      totalDeleted += result.count;
    }

    return NextResponse.json({ 
      success: true, 
      processedTenants: businesses.length,
      totalDeletedLogs: totalDeleted 
    });

  } catch (error) {
    console.error('Data Retention Cron Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
