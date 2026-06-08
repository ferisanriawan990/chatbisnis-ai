import * as xlsx from 'xlsx';
import Papa from 'papaparse';
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';

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
}

export async function parseCsv(buffer: Buffer): Promise<ParsedItem[]> {
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
      error: (error: any) => reject(error),
    });
  });
}

export async function parsePdf(buffer: Buffer): Promise<ParsedItem[]> {
  try {
    const data = await pdfParse(buffer);
    return [
      {
        searchableText: data.text,
      },
    ];
  } catch (error) {
    console.error('PDF Parse Error:', error);
    throw error;
  }
}

export async function parseDocx(buffer: Buffer): Promise<ParsedItem[]> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return [
      {
        searchableText: result.value,
      },
    ];
  } catch (error) {
    console.error('DOCX Parse Error:', error);
    throw error;
  }
}
