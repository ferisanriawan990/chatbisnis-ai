import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { validatePublicHttpsUrl } from '@/lib/security';

type Props = {
  params: Promise<{ id: string }>;
};

const getKnowledgeItem = cache(async (id: string) => {
  return prisma.knowledgeItem.findFirst({
    where: { id, isActive: true },
    select: {
      id: true,
      productName: true,
      productCategory: true,
      description: true,
      imageUrl: true,
      businessProfile: { select: { businessName: true } },
    },
  });
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = await getKnowledgeItem(id);
  if (!item) return { title: 'Produk tidak ditemukan' };

  const title = item.productName || 'Gambar Produk';
  const description = item.description || `Lihat ${title} dari ${item.businessProfile.businessName}.`;
  const imageUrl = validatePublicHttpsUrl(item.imageUrl || '') ? item.imageUrl! : undefined;

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: item.businessProfile.businessName,
      images: imageUrl ? [{ url: imageUrl, alt: title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function KnowledgeSharePage({ params }: Props) {
  const { id } = await params;
  const item = await getKnowledgeItem(id);
  if (!item || !validatePublicHttpsUrl(item.imageUrl || '')) notFound();

  const title = item.productName || 'Gambar Produk';

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <article className="mx-auto max-w-xl overflow-hidden rounded-3xl bg-white shadow-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.imageUrl!} alt={title} className="aspect-square w-full object-cover" />
        <div className="space-y-2 p-6">
          <p className="text-sm font-semibold text-blue-600">{item.businessProfile.businessName}</p>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {item.productCategory && <p className="text-sm text-slate-500">{item.productCategory}</p>}
          {item.description && <p className="leading-relaxed text-slate-700">{item.description}</p>}
        </div>
      </article>
    </main>
  );
}
