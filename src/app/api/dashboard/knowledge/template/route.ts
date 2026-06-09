import { NextResponse } from 'next/server';
import * as ExcelJS from 'exceljs';

export async function GET() {
  try {
    const workbook = new ExcelJS.Workbook();

    // SHEET 1: Instruksi
    const wsInstruksi = workbook.addWorksheet('Instruksi & Panduan');
    wsInstruksi.columns = [{ header: 'Panduan Pengisian Template', width: 80 }];
    wsInstruksi.addRow(['PENTING: Jangan ubah nama kolom di baris pertama (Header).']);
    wsInstruksi.addRow(['']);
    wsInstruksi.addRow(['Sheet "Data Produk":']);
    wsInstruksi.addRow(['- Digunakan khusus untuk menginput daftar stok/produk Anda.']);
    wsInstruksi.addRow(['- Wajib isi "nama_produk" dan "deskripsi" (atau harga).']);
    wsInstruksi.addRow(['']);
    wsInstruksi.addRow(['Sheet "Tanya Jawab (FAQ)":']);
    wsInstruksi.addRow(['- Digunakan khusus untuk pertanyaan umum (Jam Buka, Alamat, Kebijakan, dll).']);
    wsInstruksi.addRow(['- Wajib isi "pertanyaan" dan "jawaban".']);
    wsInstruksi.addRow(['']);
    wsInstruksi.addRow(['Catatan: Sheet "Instruksi" ini akan diabaikan oleh sistem saat di-upload.']);
    
    // SHEET 2: Data Produk
    const wsProduk = workbook.addWorksheet('Data Produk');
    wsProduk.columns = [
      { header: 'nama_produk', key: 'nama_produk', width: 25 },
      { header: 'kategori', key: 'kategori', width: 15 },
      { header: 'harga', key: 'harga', width: 15 },
      { header: 'stok', key: 'stok', width: 15 },
      { header: 'deskripsi', key: 'deskripsi', width: 40 },
    ];
    wsProduk.addRow({
      nama_produk: 'Sepeda Listrik Goda 125',
      kategori: 'Sepeda Listrik',
      harga: 4500000,
      stok: 'Tersedia',
      deskripsi: 'Warna merah, baterai 48V, garansi 1 tahun.',
    });

    // SHEET 3: FAQ
    const wsFaq = workbook.addWorksheet('Tanya Jawab (FAQ)');
    wsFaq.columns = [
      { header: 'pertanyaan', key: 'pertanyaan', width: 40 },
      { header: 'jawaban', key: 'jawaban', width: 50 },
    ];
    wsFaq.addRow({
      pertanyaan: 'Apakah toko buka hari Minggu?',
      jawaban: 'Ya, kami buka setiap hari dari jam 08:00 sampai 17:00 WIB.',
    });
    wsFaq.addRow({
      pertanyaan: 'Bisa cicilan atau kredit?',
      jawaban: 'Bisa, kami menerima cicilan via Home Credit atau Kredivo.',
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
