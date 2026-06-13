import { AIService } from './ai';

export interface ExtractedLead {
  isLead: boolean;
  customerName?: string;
  interest?: string;
  budget?: number;
  address?: string;
  status: 'cold' | 'warm' | 'hot';
  leadScore?: number;
  notes?: string;
  tags?: string[];
  churnReason?: string;
}

export class LeadExtractor {
  static async extract(
    chatHistory: { role: string; content: string }[],
    latestMessage: string,
    apiKey: string,
    model: string
  ): Promise<ExtractedLead | null> {
    const systemPrompt = `
Anda adalah AI pengekstrak data CRM. 
Tugas Anda adalah membaca riwayat percakapan pelanggan dengan bot, dan mengekstrak informasi detail pembelian atau ketertarikan (lead).
Jika pelanggan tidak menunjukkan ketertarikan untuk membeli, memesan, atau bertanya detail spesifik produk, balas dengan "isLead": false.

Jika pelanggan menunjukkan indikasi bertanya harga, ketersediaan produk, alamat, ukuran, atau ingin order, balas dengan JSON berformat berikut HANYA dalam JSON valid tanpa markdown \`\`\`json:
{
  "isLead": true,
  "customerName": "Nama pelanggan (jika disebutkan)",
  "interest": "Nama barang/layanan spesifik yang diminati (contoh: Kemeja Merah M)",
  "budget": 150000, // Angka integer saja tanpa simbol mata uang
  "address": "Alamat pengiriman jika disebutkan",
  "status": "hot", // 'hot' jika ingin segera bayar/beli, 'warm' jika banyak bertanya detail, 'cold' jika hanya menyapa/tanya harga dasar.
  "leadScore": 85, // Angka 1-100 merepresentasikan probabilitas pelanggan akan membeli berdasarkan antusiasme mereka.
  "notes": "Rangkuman singkat aktivitas pelanggan (contoh: Pelanggan bertanya tentang stok sepatu lari, namun ragu soal harga)",
  "tags": ["tanya-stok", "ragu-harga", "sepatu-lari"], // Array of string, berisi kata kunci segmentasi pendek (tanpa spasi, gunakan strip).
  "churnReason": "Alasan jika pelanggan membatalkan pesanan atau batal beli (misal: 'Kemahalan', 'Ongkir mahal', 'Sudah beli di tempat lain'). Kosongkan jika pelanggan masih tertarik atau sudah beli."
}

Anda harus merespon HANYA dengan JSON object tunggal.
`;

    // Ambil 5 pesan terakhir sebagai konteks agar tidak kepanjangan
    const contextMessages = chatHistory.slice(-5);
    
    let userMessage = `Pesan terbaru: "${latestMessage}"\nRiwayat singkat:\n`;
    for (const msg of contextMessages) {
      userMessage += `[${msg.role.toUpperCase()}]: ${msg.content}\n`;
    }

    try {
      const response = await AIService.generateReply({
        systemPrompt,
        userMessage,
        apiKey,
        model,
        provider: 'Flaz Cloud',
        responseFormat: { type: 'json_object' }
      });

      // Hapus backticks kalau LLM bandel
      const cleanJson = response.reply.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      const parsed = JSON.parse(cleanJson);
      
      if (parsed && typeof parsed.isLead === 'boolean') {
        return parsed as ExtractedLead;
      }
      return null;
    } catch (error) {
      console.error('Lead Extraction Failed:', error);
      return null;
    }
  }
}
