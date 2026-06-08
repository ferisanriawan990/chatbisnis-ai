import { NextResponse } from 'next/server';
import * as ExcelJS from 'exceljs';

export async function GET() {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Knowledge Base');

    worksheet.columns = [
      { header: 'pertanyaan', key: 'pertanyaan', width: 30 },
      { header: 'jawaban', key: 'jawaban', width: 40 },
      { header: 'nama_produk', key: 'nama_produk', width: 20 },
      { header: 'kategori', key: 'kategori', width: 15 },
      { header: 'harga', key: 'harga', width: 15 },
      { header: 'stok', key: 'stok', width: 15 },
      { header: 'deskripsi', key: 'deskripsi', width: 30 },
    ];

    worksheet.addRow({
      pertanyaan: 'Berapa harga produk X?',
      jawaban: 'Harga produk X adalah Rp 100.000.',
      nama_produk: 'Produk X',
      kategori: 'Pakaian',
      harga: 100000,
      stok: 'Tersedia',
      deskripsi: 'Pakaian berkualitas tinggi.',
    });

    worksheet.addRow({
      pertanyaan: 'Apakah toko buka di hari Minggu?',
      jawaban: 'Ya, kami buka setiap hari dari jam 08:00 sampai 17:00.',
      nama_produk: '',
      kategori: '',
      harga: '',
      stok: '',
      deskripsi: '',
    });

    const buffer = await workbook.xlsx.writeBuffer();

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
