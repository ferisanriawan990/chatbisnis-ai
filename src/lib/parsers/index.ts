import * as ExcelJS from 'exceljs';
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
    const workbook = new ExcelJS.Workbook();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(buffer as any);
    const worksheet = workbook.worksheets[0];
    
    if (!worksheet) {
      throw new Error('Worksheet is empty');
    }

    const items: ParsedItem[] = [];
    const headers: string[] = [];

    worksheet.eachRow((row, rowNumber) => {
      const rowValues = row.values as unknown[];
      if (rowNumber === 1) {
        // Assume first row is header
        for (let i = 1; i < rowValues.length; i++) {
          headers[i] = String(rowValues[i]).toLowerCase();
        }
      } else {
        const rowData: Record<string, unknown> = {};
        for (let i = 1; i < rowValues.length; i++) {
          if (headers[i]) {
            rowData[headers[i]] = rowValues[i];
          }
        }
        
        items.push({
          question: String(rowData['pertanyaan'] || rowData['question'] || ''),
          answer: String(rowData['jawaban'] || rowData['answer'] || ''),
          productName: String(rowData['nama_produk'] || rowData['product_name'] || ''),
          productCategory: String(rowData['kategori'] || rowData['category'] || ''),
          price: parseFloat(String(rowData['harga'] || rowData['price'] || '0')) || 0,
          stockStatus: String(rowData['stok'] || rowData['stock'] || ''),
          description: String(rowData['deskripsi'] || rowData['description'] || ''),
          searchableText: JSON.stringify(rowData),
        });
      }
    });

    return items;
  } catch {
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
          const rawData = results.data as Record<string, unknown>[];
          const parsed = rawData.map((row) => ({
            question: String(row.pertanyaan || row.question || ''),
            answer: String(row.jawaban || row.answer || ''),
            productName: String(row.nama_produk || row.product_name || ''),
            productCategory: String(row.kategori || row.category || ''),
            price: parseFloat(String(row.harga || row.price || '0')) || 0,
            stockStatus: String(row.stok || row.stock || ''),
            description: String(row.deskripsi || row.description || ''),
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
  } catch {
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
  } catch {
    throw new Error('Gagal membaca file DOCX.');
  }
}
