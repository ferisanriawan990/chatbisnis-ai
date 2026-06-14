import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { parseCsv } from '@/lib/parsers';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit(`gsheet:${ip}`, 10, 60 * 1000);
    if (!rl.success) {
      return NextResponse.json({ error: 'Terlalu banyak request. Coba lagi nanti.' }, { status: 429 });
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
              where: { status: 'active', OR: [{ expiredAt: null }, { expiredAt: { gt: new Date() } }] },
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

    const { googleSheetUrl, title, sourceId } = await req.json();

    if (!googleSheetUrl) {
      return NextResponse.json({ error: 'Google Sheet URL wajib diisi' }, { status: 400 });
    }

    // Extract spreadsheetId
    const match = googleSheetUrl.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      return NextResponse.json({ error: 'Format URL Google Sheet tidak valid' }, { status: 400 });
    }
    const spreadsheetId = match[1];

    // Extract gid if any
    let gid = '0';
    const gidMatch = googleSheetUrl.match(/gid=([0-9]+)/);
    if (gidMatch) {
      gid = gidMatch[1];
    }

    const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;

    // Fetch CSV
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    let response;
    try {
      response = await fetch(exportUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
    } catch {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: 'Gagal menghubungi Google Sheet (Timeout atau URL salah).' }, { status: 400 });
    }

    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Gagal mengambil data dari Google Sheet. Pastikan aksesnya "Anyone with the link can view".' 
      }, { status: 400 });
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran sheet terlalu besar (maksimal 10MB).' }, { status: 400 });
    }

    const csvText = await response.text();
    if (csvText.length > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran sheet terlalu besar (maksimal 10MB).' }, { status: 400 });
    }
    // Check if it returned HTML (e.g. login page)
    if (csvText.trim().startsWith('<html') || csvText.trim().startsWith('<!DOCTYPE html>')) {
      return NextResponse.json({ 
        error: 'Google Sheet belum public. Ubah permission menjadi "Anyone with the link can view".' 
      }, { status: 400 });
    }

    const buffer = Buffer.from(csvText, 'utf-8');
    const parsedItems = await parseCsv(buffer);

    if (parsedItems.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data valid di dalam sheet' }, { status: 400 });
    }

    if (parsedItems.length > 500) {
      return NextResponse.json({ error: 'Maksimal 500 baris data per sheet.' }, { status: 400 });
    }

    // If sourceId is provided, we are syncing an existing source. We replace items.
    let targetSourceId = sourceId;

    if (targetSourceId) {
      // Syncing
      const existingSource = await prisma.knowledgeSource.findFirst({
        where: { id: targetSourceId, businessProfileId: profile.id }
      });
      if (!existingSource) {
        return NextResponse.json({ error: 'Source tidak ditemukan' }, { status: 404 });
      }
      
      const newTotal = currentKnowledgeCount - existingSource.itemCount + parsedItems.length;
      if (newTotal > maxKnowledgeItems) {
        return NextResponse.json({ error: `Batas maksimal knowledge base Anda adalah ${maxKnowledgeItems} item.` }, { status: 400 });
      }
      
      // Delete old items and insert new ones inside a transaction
      await prisma.$transaction(async (tx) => {
        await tx.knowledgeItem.deleteMany({
          where: { sourceId: targetSourceId }
        });

        await tx.knowledgeSource.update({
          where: { id: targetSourceId },
          data: {
            itemCount: parsedItems.length,
            status: 'active',
            googleSheetUrl
          }
        });

        const dataToInsert = parsedItems.map(item => ({
          userId,
          businessProfileId: profile.id,
          sourceId: targetSourceId,
          question: item.question,
          answer: item.answer,
          productName: item.productName,
          productCategory: item.productCategory,
          price: item.price,
          stockStatus: item.stockStatus,
          description: item.description,
          imageUrl: item.imageUrl,
          metadataJson: item.metadataJson,
          searchableText: item.searchableText,
          isActive: true,
        }));

        await tx.knowledgeItem.createMany({
          data: dataToInsert
        });
      });

    } else {
      // New import
      if (currentKnowledgeCount + parsedItems.length > maxKnowledgeItems) {
        return NextResponse.json({ error: `Batas maksimal knowledge base Anda adalah ${maxKnowledgeItems} item. Saat ini Anda memiliki ${currentKnowledgeCount} item.` }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        const source = await tx.knowledgeSource.create({
          data: {
            userId,
            businessProfileId: profile.id,
            type: 'google_sheet',
            title: title || 'Google Sheet Import',
            googleSheetUrl,
            status: 'active',
            itemCount: parsedItems.length
          }
        });
        
        targetSourceId = source.id;

        const dataToInsert = parsedItems.map(item => ({
          userId,
          businessProfileId: profile.id,
          sourceId: targetSourceId,
          question: item.question,
          answer: item.answer,
          productName: item.productName,
          productCategory: item.productCategory,
          price: item.price,
          stockStatus: item.stockStatus,
          description: item.description,
          imageUrl: item.imageUrl,
          metadataJson: item.metadataJson,
          searchableText: item.searchableText,
          isActive: true,
        }));

        await tx.knowledgeItem.createMany({
          data: dataToInsert
        });
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `${parsedItems.length} data berhasil diimport dari Google Sheet.` 
    });

  } catch (error) {
    console.error('Google Sheet Import Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
