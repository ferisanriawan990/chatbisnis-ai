import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const templatesMeta = [
  {
    id: 'basic-ai-cs',
    title: 'Template Basic AI Customer Service',
    description: 'Jawab chat WhatsApp otomatis dengan AI. Cocok untuk UMKM umum dengan prompt ramah, sopan, dan bahasa Indonesia.',
    target: 'UMKM Umum',
    status: 'Recommended',
    filename: 'basic-ai-cs.json'
  },
  {
    id: 'ai-cs-product-knowledge',
    title: 'Template AI CS + Product Knowledge',
    description: 'Jawab chat berdasarkan daftar produk. Sangat cocok jika Anda memiliki banyak varian harga, stok, atau katalog statis.',
    target: 'Toko Online / Retail',
    status: 'Recommended',
    filename: 'ai-cs-product-knowledge.json'
  },
  {
    id: 'lead-capture',
    title: 'Template Lead Capture WhatsApp',
    description: 'Deteksi nama, nomor, kebutuhan, dan minat produk. AI otomatis menyimpan data calon pelanggan ke database/API Anda.',
    target: 'Marketing & Sales',
    status: 'Advanced',
    filename: 'lead-capture.json'
  },
  {
    id: 'human-handover',
    title: 'Template Human Handover',
    description: 'Otomatis hentikan AI dan berikan notifikasi ke WhatsApp Admin saat customer marah atau butuh bantuan manusia.',
    target: 'Customer Support',
    status: 'Advanced',
    filename: 'human-handover.json'
  }
];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ templates: templatesMeta });
}
