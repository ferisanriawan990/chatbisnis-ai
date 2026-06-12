import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { parseExcel, parseCsv, parsePdf, parseDocx, ParsedItem } from '@/lib/parsers';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit(`upload:${ip}`, 10, 60 * 1000);
    if (!rl.success) {
      return NextResponse.json({ error: 'Terlalu banyak upload. Coba lagi nanti.' }, { status: 429 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

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

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Ukuran file maksimal 10MB' }, { status: 400 });
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['xlsx', 'xls', 'csv', 'pdf', 'docx'];
    if (!extension || !allowedExtensions.includes(extension)) {
      return NextResponse.json({ error: 'Format file tidak didukung' }, { status: 400 });
    }

    const mimeType = file.type;
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedMimeTypes.includes(mimeType) && extension !== 'csv') {
      return NextResponse.json({ error: 'MIME type tidak didukung' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Magic Bytes check
    if (extension === 'pdf') {
      if (buffer.length < 4 || buffer.toString('utf8', 0, 4) !== '%PDF') {
         return NextResponse.json({ error: 'File PDF tidak valid (Magic bytes mismatch)' }, { status: 400 });
      }
    } else if (['xlsx', 'docx'].includes(extension)) {
      if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4B || buffer[2] !== 0x03 || buffer[3] !== 0x04) {
         return NextResponse.json({ error: 'File dokumen tidak valid (Magic bytes mismatch)' }, { status: 400 });
      }
    }

    let parsedItems: ParsedItem[] = [];
    let type: 'excel' | 'csv' | 'pdf' | 'docx' | 'manual' = 'manual';

    try {
      if (['xlsx', 'xls'].includes(extension)) {
        parsedItems = await parseExcel(buffer);
        type = 'excel';
      } else if (extension === 'csv') {
        parsedItems = await parseCsv(buffer);
        type = 'csv';
      } else if (extension === 'pdf') {
        parsedItems = await parsePdf(buffer);
        type = 'pdf';
      } else if (extension === 'docx') {
        parsedItems = await parseDocx(buffer);
        type = 'docx';
      }
    } catch (parseError) {
      return NextResponse.json({ error: (parseError as Error).message || 'Gagal memproses file' }, { status: 400 });
    }

    if (parsedItems.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data valid di dalam file' }, { status: 400 });
    }

    if (parsedItems.length > 500) {
      return NextResponse.json({ error: 'Maksimal 500 baris data per upload.' }, { status: 400 });
    }

    if (currentKnowledgeCount + parsedItems.length > maxKnowledgeItems) {
      return NextResponse.json({ error: `Batas maksimal knowledge base Anda adalah ${maxKnowledgeItems} item. Saat ini Anda memiliki ${currentKnowledgeCount} item.` }, { status: 400 });
    }

    // Save to DB
    const source = await prisma.knowledgeSource.create({
      data: {
        userId,
        businessProfileId: profile.id,
        title: file.name,
        originalFileName: file.name,
        type,
        status: 'active',
        itemCount: parsedItems.length,
      },
    });

    const sanitizeText = (text: unknown) => {
      if (!text) return '';
      // Limit max string length to 2000 chars per field to prevent DB DoS
      const str = String(text).slice(0, 2000);
      return str.replace(/<[^>]*>?/gm, '').trim();
    };

    const itemsToInsert = parsedItems.map((item) => {
      // Ensure searchable text is never fully empty, fallback to product name or question
      const sText = sanitizeText(item.searchableText) || sanitizeText(item.productName) || sanitizeText(item.question) || 'Data';
      
      return {
        userId,
        businessProfileId: profile.id,
        sourceId: source.id,
        category: item.productName ? 'product' : 'qa',
        question: sanitizeText(item.question),
        answer: sanitizeText(item.answer),
        productName: sanitizeText(item.productName),
        productCategory: sanitizeText(item.productCategory),
        price: item.price ?? null,
        stockStatus: sanitizeText(item.stockStatus),
        description: sanitizeText(item.description),
        imageUrl: item.imageUrl ? sanitizeText(item.imageUrl) : null,
        metadataJson: item.metadataJson || null,
        searchableText: sText,
      };
    });

    await prisma.knowledgeItem.createMany({
      data: itemsToInsert,
    });

    return NextResponse.json({ success: true, source });
  } catch (error) {
    console.error('POST /api/dashboard/knowledge/upload Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
