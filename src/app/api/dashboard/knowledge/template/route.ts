import { NextResponse } from 'next/server';
import * as xlsx from 'xlsx';

export async function GET() {
  try {
    const data = [
      {
        pertanyaan: 'Berapa harga produk X?',
        jawaban: 'Harga produk X adalah Rp 100.000.',
        nama_produk: 'Produk X',
        kategori: 'Pakaian',
        harga: 100000,
        stok: 'Tersedia',
        deskripsi: 'Pakaian berkualitas tinggi.',
      },
      {
        pertanyaan: 'Apakah toko buka di hari Minggu?',
        jawaban: 'Ya, kami buka setiap hari dari jam 08:00 sampai 17:00.',
        nama_produk: '',
        kategori: '',
        harga: '',
        stok: '',
        deskripsi: '',
      },
    ];

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Knowledge Base');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Template_Knowledge_Base.xlsx"',
      },
    });
  } catch (error) {
    console.error('GET /api/dashboard/knowledge/template Error:', error);
    return NextResponse.json({ error: 'Gagal membuat template' }, { status: 500 });
  }
}
