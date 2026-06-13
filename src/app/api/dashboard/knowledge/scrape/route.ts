import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as cheerio from 'cheerio';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit(`scrape:${ip}`, 10, 60 * 1000);
    if (!rl.success) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan. Coba lagi nanti.' }, { status: 429 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { url } = await req.json();

    if (!url || !url.startsWith('http')) {
      return NextResponse.json({ error: 'URL tidak valid' }, { status: 400 });
    }

    const profile = await prisma.businessProfile.findFirst({
      where: { userId },
      include: {
        user: {
          include: {
            subscriptions: {
              include: { plan: true },
              where: { status: 'active' },
              take: 1
            }
          }
        }
      }
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profil bisnis tidak ditemukan' }, { status: 404 });
    }

    const activePlan = profile.user.subscriptions[0]?.plan;
    const maxKnowledgeItems = activePlan?.maxKnowledgeItems || 50;

    const currentKnowledgeCount = await prisma.knowledgeItem.count({
      where: { businessProfileId: profile.id }
    });

    if (currentKnowledgeCount >= maxKnowledgeItems) {
      return NextResponse.json({ error: `Batas maksimal knowledge base Anda adalah ${maxKnowledgeItems} item.` }, { status: 400 });
    }

    // Fetch the URL
    const res = await fetch(url, {
      headers: { 'User-Agent': 'ChatBisnisAI-Bot/1.0' },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Gagal mengakses URL tersebut.' }, { status: 400 });
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Remove unwanted tags
    $('script, style, nav, footer, header, noscript, iframe, svg, img').remove();

    const title = $('title').text() || url;
    let textContent = $('body').text();

    // Clean text
    textContent = textContent
      .replace(/\s+/g, ' ')
      .trim();

    if (!textContent) {
      return NextResponse.json({ error: 'Tidak ada teks yang dapat diekstrak dari URL ini.' }, { status: 400 });
    }

    // Chunk the text into segments of ~1000 characters
    const chunks: string[] = [];
    const maxChunkLength = 1000;
    
    // Split by sentence roughly
    const sentences = textContent.match(/[^.!?]+[.!?]+/g) || [textContent];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk.length + sentence.length) > maxChunkLength && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += ' ' + sentence;
      }
    }
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    // Limit to prevent abuse
    if (currentKnowledgeCount + chunks.length > maxKnowledgeItems) {
      return NextResponse.json({ error: `Ekstraksi menghasilkan ${chunks.length} item, yang akan melampaui sisa kuota Anda.` }, { status: 400 });
    }

    // Save to DB
    const source = await prisma.knowledgeSource.create({
      data: {
        userId,
        businessProfileId: profile.id,
        title: `Web Scrape: ${title.substring(0, 50)}`,
        originalFileName: url,
        type: 'web_scraping',
        status: 'active',
        itemCount: chunks.length,
      },
    });

    const itemsToInsert = chunks.map((chunk) => ({
      userId,
      businessProfileId: profile.id,
      sourceId: source.id,
      category: 'general',
      searchableText: chunk,
    }));

    await prisma.knowledgeItem.createMany({
      data: itemsToInsert,
    });

    return NextResponse.json({ success: true, source });
  } catch (error) {
    console.error('POST /api/dashboard/knowledge/scrape Error:', error);
    return NextResponse.json({ error: 'Gagal mengekstrak konten dari URL ini.' }, { status: 500 });
  }
}
