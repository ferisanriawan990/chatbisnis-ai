import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { manualKnowledgeSchema } from '@/lib/validations';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const body = await req.json();
    
    const parsed = manualKnowledgeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });
    }

    const data = parsed.data;

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

    if (currentKnowledgeCount >= maxKnowledgeItems) {
      return NextResponse.json({ error: `Batas maksimal knowledge base Anda adalah ${maxKnowledgeItems} item.` }, { status: 400 });
    }

    let title = 'Input Manual';
    let searchableText = '';

    if (data.type === 'qa') {
      title = `Q&A: ${data.question?.substring(0, 30)}...`;
      searchableText = `Tanya: ${data.question}\nJawab: ${data.answer}`;
    } else {
      title = `Produk: ${data.productName}`;
      searchableText = `Produk: ${data.productName}\nKategori: ${data.productCategory}\nHarga: ${data.price}\nStok: ${data.stockStatus}\nDeskripsi: ${data.description}`;
    }

    // Create a manual source
    const source = await prisma.knowledgeSource.create({
      data: {
        userId,
        businessProfileId: profile.id,
        type: 'manual',
        title,
        status: 'active',
        itemCount: 1,
      },
    });

    // Create the item
    await prisma.knowledgeItem.create({
      data: {
        userId,
        businessProfileId: profile.id,
        sourceId: source.id,
        category: data.type,
        question: data.question,
        answer: data.answer,
        productName: data.productName,
        productCategory: data.productCategory,
        price: data.price,
        stockStatus: data.stockStatus,
        description: data.description,
        imageUrl: data.imageUrl || null,
        searchableText,
      },
    });

    return NextResponse.json({ success: true, source });
  } catch (error) {
    console.error('POST /api/dashboard/knowledge/manual Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
