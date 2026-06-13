import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;
    const profile = await prisma.businessProfile.findFirst({ where: { userId } });
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '7d';
    
    // Calculate start date
    const startDate = new Date();
    if (range === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (range === '30d') startDate.setDate(startDate.getDate() - 30);
    else if (range === '90d') startDate.setDate(startDate.getDate() - 90);
    else startDate.setDate(startDate.getDate() - 7); // Default 7d

    // 1. Average Admin Response Time
    // We fetch ChatLogs with '[Admin Reply]' and parse their metadataJson
    const adminReplies = await prisma.chatLog.findMany({
      where: {
        businessProfileId: profile.id,
        messageIn: '[Admin Reply]',
        createdAt: { gte: startDate }
      },
      select: { metadataJson: true }
    });

    let totalResponseTimeMs = 0;
    let responseCount = 0;

    adminReplies.forEach(log => {
      if (log.metadataJson) {
        try {
          const meta = JSON.parse(log.metadataJson);
          if (meta.responseTimeMs) {
            totalResponseTimeMs += meta.responseTimeMs;
            responseCount++;
          }
        } catch (e) {}
      }
    });

    const averageResponseTimeMs = responseCount > 0 ? Math.floor(totalResponseTimeMs / responseCount) : 0;
    const averageResponseTimeMinutes = Math.floor(averageResponseTimeMs / 60000);

    // 2. Top FAQs (Matched Knowledge Items)
    const chatLogsWithFaq = await prisma.chatLog.findMany({
      where: {
        businessProfileId: profile.id,
        createdAt: { gte: startDate }
      },
      select: { metadataJson: true }
    });

    const faqCounts: Record<string, number> = {};
    chatLogsWithFaq.forEach(log => {
      if (log.metadataJson) {
        try {
          const meta = JSON.parse(log.metadataJson);
          if (meta.matchedKnowledgeItemIds && Array.isArray(meta.matchedKnowledgeItemIds)) {
            meta.matchedKnowledgeItemIds.forEach((id: string) => {
              faqCounts[id] = (faqCounts[id] || 0) + 1;
            });
          }
        } catch (e) {}
      }
    });

    // Resolve FAQ titles
    const faqIds = Object.keys(faqCounts);
    let topFaqs = [];
    if (faqIds.length > 0) {
      const faqs = await prisma.knowledgeItem.findMany({
        where: { id: { in: faqIds } },
        select: { id: true, question: true, title: true } // 'question' is used in schema, but it might be 'title' if we use source title? Wait, KnowledgeItem has 'question' and 'productName'
      });
      
      topFaqs = faqs.map(faq => ({
        id: faq.id,
        title: faq.question || faq.productName || 'Unknown Topic',
        count: faqCounts[faq.id]
      })).sort((a, b) => b.count - a.count).slice(0, 10);
    }

    // 3. Sales Leaderboard
    const convertedLeads = await prisma.lead.findMany({
      where: {
        businessProfileId: profile.id,
        status: 'converted',
        updatedAt: { gte: startDate } // use updatedAt for conversion date
      },
      select: { assignedAdminId: true }
    });

    const adminScores: Record<string, number> = {};
    convertedLeads.forEach(lead => {
      if (lead.assignedAdminId) {
        adminScores[lead.assignedAdminId] = (adminScores[lead.assignedAdminId] || 0) + 1;
      }
    });

    const adminIds = Object.keys(adminScores);
    let salesLeaderboard = [];
    if (adminIds.length > 0) {
      const admins = await prisma.user.findMany({
        where: { id: { in: adminIds } },
        select: { id: true, name: true }
      });

      salesLeaderboard = admins.map(admin => ({
        id: admin.id,
        name: admin.name,
        convertedLeads: adminScores[admin.id]
      })).sort((a, b) => b.convertedLeads - a.convertedLeads);
    }

    return NextResponse.json({
      averageResponseTimeMinutes,
      averageResponseTimeMs,
      responseCount,
      topFaqs,
      salesLeaderboard
    });

  } catch (error: any) {
    console.error('Advanced Analytics Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
