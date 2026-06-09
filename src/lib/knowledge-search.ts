import { prisma } from './prisma';
import { KnowledgeItem } from '@prisma/client';

export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

export function detectCustomerIntent(message: string): string {
  const msg = normalizeText(message);
  
  if (msg.match(/^(halo|hai|p|pagi|siang|sore|malam|assalamualaikum|oy|hy|hi)$/i)) return 'salam';
  
  // Handover specific
  if (msg.match(/(admin|cs|manusia|operator|hubungi|bantuan)/i)) return 'admin_handover';
  
  // Lists
  if (msg.match(/(daftar stok|apa aja|unit ready apa aja|katalog|stok apa aja|ready apa aja|list)/i)) return 'daftar_stok';
  
  // Specific Product inquiries
  if (msg.match(/(harga kredit|kredit|cicilan|angsuran|kreditnya|cicilannya)/i)) return 'harga_kredit';
  if (msg.match(/(dp|uang muka|dpnya|uang mukanya)/i)) return 'dp_cicilan';
  if (msg.match(/(warna|pilihan warna|varian warna|warna apa aja)/i)) return 'warna';
  if (msg.match(/(spek|spesifikasi|baterai|dinamo|jarak tempuh|ban|watt|ukuran|dimensi|kecepatan)/i)) return 'spesifikasi';
  if (msg.match(/(harga|berapa|harganya|pricelist|cash)/i)) return 'harga_produk';
  if (msg.match(/(stok|stock|ready|ada|tersedia|masih ada|sisa)/i)) return 'stok_produk';
  
  // General Info
  if (msg.match(/(lokasi|jam buka|alamat|buka|tutup|dimana|tempat)/i)) return 'lokasi';
  if (msg.match(/(pembayaran|bayar|cod|transfer|cicil pakai|kredit via)/i)) return 'pembayaran';
  if (msg.match(/(pengiriman|ongkir|kirim|ekspedisi)/i)) return 'pengiriman';
  if (msg.match(/(order|beli|minat|pesan|mau|ambil|checkout)/i)) return 'order';
  
  return 'general';
}

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function extractMetadata(item: KnowledgeItem): Record<string, string> {
  if (!item.metadataJson) return {};
  try {
    return JSON.parse(item.metadataJson);
  } catch {
    return {};
  }
}

export async function searchKnowledgeItems(message: string, businessProfileId: string): Promise<KnowledgeItem[]> {
  const msg = normalizeText(message);
  
  const allItems = await prisma.knowledgeItem.findMany({
    where: { businessProfileId, isActive: true },
  });

  const words = msg.split(/\s+/).filter(w => w.length > 2);
  
  const scoredItems = allItems.map(item => {
    let score = 0;
    const searchable = normalizeText(item.searchableText);
    const productName = normalizeText(item.productName || '');
    const category = normalizeText(item.productCategory || '');
    
    // Exact match
    if (productName && msg.includes(productName)) score += 50;
    
    if (category && msg.includes(category)) score += 20;
    if (item.question && msg.includes(normalizeText(item.question))) score += 30;
    
    for (const word of words) {
      if (productName.includes(word)) score += 10;
      else if (category.includes(word)) score += 5;
      else if (searchable.includes(word)) score += 2;
    }

    const intent = detectCustomerIntent(msg);
    if ((['stok_produk', 'harga_produk', 'harga_kredit', 'dp_cicilan', 'warna', 'spesifikasi'].includes(intent)) && productName) {
      score += 10; // Boost products when asking product questions
    }

    if (category && words.some(w => category.includes(w))) {
      score += 15;
    }

    return { item, score };
  });

  return scoredItems
    .filter(si => si.score > 5)
    .sort((a, b) => b.score - a.score)
    .map(si => si.item);
}

export function formatProductDetail(p: KnowledgeItem, intent: string): string {
  const meta = extractMetadata(p);
  
  let reply = `Berikut informasi tipe *${p.productName}*:\n\n`;
  if (p.productCategory) reply += `Kategori: ${p.productCategory}\n`;
  if (p.price) reply += `Harga Cash: ${formatRupiah(p.price)}\n`;
  if (p.stockStatus) reply += `Stok: ${p.stockStatus}\n`;

  if (intent === 'warna' || intent === 'stok_produk' || intent === 'harga_produk' || intent === 'general') {
    if (meta['Warna']) reply += `Warna Tersedia: ${meta['Warna']}\n`;
  }
  
  if (intent === 'harga_kredit' || intent === 'dp_cicilan' || intent === 'harga_produk' || intent === 'general') {
    if (meta['Harga Kredit']) reply += `Harga Kredit: ${meta['Harga Kredit']}\n`;
    if (meta['DP']) reply += `Minimal DP: ${meta['DP']}\n`;
  }

  if (intent === 'spesifikasi' || intent === 'general') {
    if (meta['Spesifikasi']) reply += `Spesifikasi: ${meta['Spesifikasi']}\n`;
    if (meta['Garansi']) reply += `Garansi: ${meta['Garansi']}\n`;
    if (meta['Bonus']) reply += `Bonus: ${meta['Bonus']}\n`;
    if (p.description) reply += `\nDeskripsi Tambahan:\n${p.description}\n`;
  }
  
  return reply;
}

export function buildProductAnswer(message: string, matchedItems: KnowledgeItem[]): string | null {
  const intent = detectCustomerIntent(message);
  
  const productIntents = ['daftar_stok', 'stok_produk', 'harga_produk', 'harga_kredit', 'dp_cicilan', 'warna', 'spesifikasi'];
  if (!productIntents.includes(intent)) return null;

  const products = matchedItems.filter(i => i.productName);

  // Jika produk tidak ditemukan padahal nanya produk
  if (products.length === 0) {
    if (intent !== 'daftar_stok') {
      return "Untuk tipe/info itu saya belum menemukan datanya di sistem. Saya bantu teruskan ke admin ya kak.";
    }
  }

  // Handle daftar_stok intent
  if (intent === 'daftar_stok') {
    if (products.length === 0) {
      return "Saat ini kami belum memiliki data produk di sistem.";
    }
    let reply = `Ready kak, berikut daftar stok yang tersedia:\n\n`;
    const displayProducts = products.slice(0, 12);
    
    displayProducts.forEach((p, idx) => {
      const priceStr = p.price ? ` — ${formatRupiah(p.price)}` : '';
      const stockStr = p.stockStatus ? ` — Stok: ${p.stockStatus}` : '';
      reply += `${idx + 1}. ${p.productName}${priceStr}${stockStr}\n`;
    });

    if (products.length > 12) {
      reply += `\n...dan masih banyak tipe lainnya.\n`;
    }
    reply += `\nKakak mau tanya detail tipe yang mana? Atau ketik nama tipenya ya kak biar saya bantu cek detailnya.`;
    return reply;
  }

  // Handle single product detail inquiry (1-2 strong matches)
  if (products.length > 0 && products.length <= 3) {
    const p = products[0];
    let reply = formatProductDetail(p, intent);
    reply += `\nApakah kakak berminat dengan tipe ini?`;
    return reply;
  }

  // If asking for a specific trait but multiple matches are returned (e.g. "warna apa aja" without specifying product)
  if (intent === 'warna' && products.length > 3) {
    return "Kakak mau cek warna untuk tipe sepeda listrik yang mana? Sebutkan nama tipenya ya kak.";
  }

  // Default fallback for multiple products
  let reply = `Ada beberapa tipe yang sesuai pencarian kakak:\n\n`;
  products.slice(0, 5).forEach((p, idx) => {
    reply += `${idx + 1}. ${p.productName} — ${p.price ? formatRupiah(p.price) : 'Harga tidak tersedia'}\n`;
  });
  reply += `\nKakak mau info detail yang mana?`;
  
  return reply;
}
