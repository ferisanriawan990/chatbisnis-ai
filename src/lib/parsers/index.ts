import * as xlsx from 'xlsx';
import Papa from 'papaparse';

export interface ParsedItem {
  question?: string;
  answer?: string;
  productName?: string;
  productCategory?: string;
  price?: number;
  stockStatus?: string;
  description?: string;
  searchableText: string;
}

export async function parseExcel(buffer: Buffer): Promise<ParsedItem[]> {
  try {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json<any>(sheet);

    return rawData.map((row) => ({
      question: row.pertanyaan || row.question || '',
      answer: row.jawaban || row.answer || '',
      productName: row.nama_produk || row.product_name || '',
      productCategory: row.kategori || row.category || '',
      price: parseFloat(row.harga || row.price || '0') || 0,
      stockStatus: row.stok || row.stock || '',
      description: row.deskripsi || row.description || '',
      searchableText: JSON.stringify(row),
    }));
  } catch (error) {
    throw new Error('Gagal membaca file Excel. Pastikan formatnya benar.');
  }
}

export async function parseCsv(buffer: Buffer): Promise<ParsedItem[]> {
  try {
    const text = buffer.toString('utf-8');
    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rawData = results.data as any[];
          const parsed = rawData.map((row) => ({
            question: row.pertanyaan || row.question || '',
            answer: row.jawaban || row.answer || '',
            productName: row.nama_produk || row.product_name || '',
            productCategory: row.kategori || row.category || '',
            price: parseFloat(row.harga || row.price || '0') || 0,
            stockStatus: row.stok || row.stock || '',
            description: row.deskripsi || row.description || '',
            searchableText: JSON.stringify(row),
          }));
          resolve(parsed);
        },
        error: () => reject(new Error('Gagal membaca file CSV.')),
      });
    });
  } catch {
    throw new Error('Gagal membaca file CSV.');
  }
}

export async function parsePdf(buffer: Buffer): Promise<ParsedItem[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    return [
      {
        searchableText: data.text,
      },
    ];
  } catch (error) {
    throw new Error('Gagal membaca file PDF.');
  }
}

export async function parseDocx(buffer: Buffer): Promise<ParsedItem[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return [
      {
        searchableText: result.value,
      },
    ];
  } catch (error) {
    throw new Error('Gagal membaca file DOCX.');
  }
}
