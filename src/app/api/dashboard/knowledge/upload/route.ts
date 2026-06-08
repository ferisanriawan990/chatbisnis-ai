import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { parseExcel, parseCsv, parsePdf, parseDocx } from '@/lib/parsers';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`upload:${ip}`, 10, 60 * 1000);
    if (!rl.success) {
      return NextResponse.json({ error: 'Terlalu banyak upload. Coba lagi nanti.' }, { status: 429 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    const profile = await prisma.businessProfile.findFirst({ where: { userId } });
    if (!profile) {
      return NextResponse.json({ error: 'Profil bisnis tidak ditemukan' }, { status: 404 });
    }

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

    const buffer = Buffer.from(await file.arrayBuffer());
    let parsedItems: any[] = [];
    let type: any = 'manual';

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
    } catch (parseError: any) {
      return NextResponse.json({ error: parseError.message || 'Gagal memproses file' }, { status: 400 });
    }

    if (parsedItems.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data valid di dalam file' }, { status: 400 });
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

    const itemsToInsert = parsedItems.map((item) => ({
      userId,
      businessProfileId: profile.id,
      sourceId: source.id,
      category: item.productName ? 'product' : 'qa',
      question: String(item.question || ''),
      answer: String(item.answer || ''),
      productName: String(item.productName || ''),
      productCategory: String(item.productCategory || ''),
      price: Number(item.price || 0),
      stockStatus: String(item.stockStatus || ''),
      description: String(item.description || ''),
      searchableText: String(item.searchableText || ''),
    }));

    await prisma.knowledgeItem.createMany({
      data: itemsToInsert,
    });

    return NextResponse.json({ success: true, source });
  } catch (error) {
    console.error('POST /api/dashboard/knowledge/upload Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
