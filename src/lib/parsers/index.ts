import * as ExcelJS from 'exceljs';
import Papa from 'papaparse';

export interface ParsedItem {
  question?: string;
  answer?: string;
  productName?: string;
  productCategory?: string;
  price?: number | null;
  stockStatus?: string;
  description?: string;
  imageUrl?: string;
  metadataJson?: string;
  searchableText: string;
}

/**
 * Normalize header by lowercasing, trimming, and removing non-alphanumeric chars.
 * E.g., "Nama Produk", "nama_produk", "nama-produk" -> "namaproduk"
 */
function normalizeHeader(header: string): string {
  if (!header) return '';
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Parse Indonesian price format. 
 * Examples: "Rp 6.500.000", "6,500,000", "6500000"
 */
function parseIndonesianPrice(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const strValue = String(value).trim();
  if (strValue === '') return null;
  
  // Remove Rp, spaces, and formatting dots/commas
  const cleanStr = strValue.replace(/rp/i, '').replace(/\s/g, '').replace(/[^\d.,]/g, '');
  if (!cleanStr) return null;

  // Handle dot as thousand separator and comma as decimal
  // e.g. "6.500.000,00"
  let parsed = cleanStr;
  if (parsed.includes(',') && parsed.includes('.')) {
    // If dot is before comma, it's indonesian format
    if (parsed.indexOf('.') < parsed.indexOf(',')) {
      parsed = parsed.replace(/\./g, '').replace(',', '.');
    } else {
      // US format
      parsed = parsed.replace(/,/g, '');
    }
  } else if (parsed.includes(',')) {
    // Check if it's a decimal or thousand separator
    // If there are exactly 3 digits after comma, it might be a thousand separator
    if (parsed.match(/,\d{3}$/)) {
      parsed = parsed.replace(',', '');
    } else {
      parsed = parsed.replace(',', '.');
    }
  } else if (parsed.includes('.')) {
    // If multiple dots, definitely thousand separator
    if (parsed.split('.').length > 2) {
      parsed = parsed.replace(/\./g, '');
    } else if (parsed.match(/\.\d{3}$/)) {
      // Single dot with 3 digits, probably thousand separator
      parsed = parsed.replace('.', '');
    }
  }

  const num = parseFloat(parsed);
  return isNaN(num) ? null : num;
}

function processRow(rawData: Record<string, unknown>): ParsedItem | null {
  // Check if row is entirely empty
  const hasData = Object.values(rawData).some(v => v !== null && v !== undefined && String(v).trim() !== '');
  if (!hasData) return null;

  let question = '';
  let answer = '';
  let productName = '';
  let productCategory = '';
  let priceStr: string | null = null;
  let stockStatus = '';
  let description = '';
  let imageUrl = '';
  const extraMetadata: Record<string, string> = {};

  for (const [rawKey, rawValue] of Object.entries(rawData)) {
    if (rawValue === null || rawValue === undefined) continue;
    const val = String(rawValue).trim();
    if (val === '') continue;

    const normKey = normalizeHeader(rawKey);

    if (['pertanyaan', 'question', 'tanya'].includes(normKey)) {
      question = val;
    } else if (['jawaban', 'answer', 'jawab'].includes(normKey)) {
      answer = val;
    } else if (['namaproduk', 'produk', 'product', 'productname', 'namabarang', 'barang', 'tipe', 'model', 'namaunit', 'unit'].includes(normKey)) {
      productName = val;
    } else if (['kategori', 'category', 'jenis', 'tipekategori', 'jenisbarang'].includes(normKey)) {
      productCategory = val;
    } else if (['harga', 'price', 'hargacash', 'cash', 'hargajual', 'harganormal', 'otr', 'hargaotr'].includes(normKey)) {
      priceStr = val;
    } else if (['stok', 'stock', 'stockstatus', 'statusstok', 'ready', 'ketersediaan', 'stokgudang', 'qty', 'jumlah', 'unitready'].includes(normKey)) {
      stockStatus = val;
    } else if (['deskripsi', 'description', 'keterangan', 'detail'].includes(normKey)) {
      description = val;
    } else if (['gambar', 'image', 'foto', 'photo', 'imageurl', 'urlgambar', 'linkgambar'].includes(normKey)) {
      imageUrl = val;
    } else if (['warna', 'color', 'varianwarna', 'pilihanwarna'].includes(normKey)) {
      extraMetadata['Warna'] = val;
    } else if (['hargakredit', 'kredit', 'cicilan', 'angsuran'].includes(normKey)) {
      extraMetadata['Harga Kredit'] = val;
    } else if (['dp', 'uangmuka', 'downpayment'].includes(normKey)) {
      extraMetadata['DP'] = val;
    } else if (['spesifikasi', 'spek', 'baterai', 'dinamo', 'watt', 'jaraktempuh', 'kecepatan', 'ukuranban'].includes(normKey)) {
      // Append to specification
      const currentSpec = extraMetadata['Spesifikasi'] || '';
      extraMetadata['Spesifikasi'] = currentSpec ? `${currentSpec}, ${rawKey}: ${val}` : `${rawKey}: ${val}`;
    } else if (['garansi', 'warranty'].includes(normKey)) {
      extraMetadata['Garansi'] = val;
    } else if (['bonus', 'free', 'include'].includes(normKey)) {
      extraMetadata['Bonus'] = val;
    } else {
      // Store any unmapped fields into metadata
      extraMetadata[rawKey.trim()] = val;
    }
  }

  const price = priceStr !== null ? parseIndonesianPrice(priceStr) : null;

  // Build natural searchable text
  const textParts: string[] = [];
  if (productName) textParts.push(`Produk: ${productName}`);
  if (productCategory) textParts.push(`Kategori: ${productCategory}`);
  if (price !== null) textParts.push(`Harga: ${priceStr}`);
  if (stockStatus) textParts.push(`Stok: ${stockStatus}`);
  if (question) textParts.push(`Q: ${question}`);
  if (answer) textParts.push(`A: ${answer}`);
  
  // Add extra metadata to searchable text
  for (const [key, value] of Object.entries(extraMetadata)) {
    textParts.push(`${key}: ${value}`);
  }

  if (description) textParts.push(`Deskripsi: ${description}`);

  const searchableText = textParts.join('\n');

  return {
    question,
    answer,
    productName,
    productCategory,
    price,
    stockStatus,
    description,
    imageUrl,
    metadataJson: Object.keys(extraMetadata).length > 0 ? JSON.stringify(extraMetadata) : undefined,
    searchableText,
  };
}

export async function parseExcel(buffer: Buffer): Promise<ParsedItem[]> {
  try {
    const workbook = new ExcelJS.Workbook();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await workbook.xlsx.load(buffer as any);
    } catch {
      throw new Error('Gagal membaca file Excel. Jika Anda menggunakan format lama (.xls), harap Save As ke format baru (.xlsx) lalu upload ulang.');
    }
    const items: ParsedItem[] = [];

    workbook.worksheets.forEach((worksheet) => {
      if (worksheet.name.toLowerCase().includes('instruksi') || worksheet.name.toLowerCase().includes('panduan')) {
        return; // Skip instruction sheets
      }

      const headers: string[] = [];
      let rowCount = 0;
      worksheet.eachRow((row, rowNumber) => {
        if (rowCount > 1000) return; // Limit excel rows
        rowCount++;
        const rowValues = row.values as unknown[];
        if (rowNumber === 1) {
          // Assume first row is header
          for (let i = 1; i < Math.min(rowValues.length, 50); i++) { // Limit columns to 50
            headers[i] = String(rowValues[i] || `column_${i}`);
          }
        } else {
          const rowData: Record<string, unknown> = {};
          for (let i = 1; i < Math.min(rowValues.length, 50); i++) {
            if (headers[i]) {
              rowData[headers[i]] = rowValues[i];
            }
          }
          
          const parsedItem = processRow(rowData);
          if (parsedItem) items.push(parsedItem);
        }
      });
    });

    return items;
  } catch (error: any) {
    throw new Error(error?.message || 'Gagal membaca file Excel. Pastikan formatnya benar.');
  }
}

export async function parseCsv(buffer: Buffer): Promise<ParsedItem[]> {
  try {
    const rawText = buffer.toString('utf-8');
    // Remove lines that are entirely empty or only contain commas/whitespace
    const lines = rawText.split('\n');
    const validLines = lines.filter(line => line.replace(/,/g, '').trim().length > 0);
    const text = validLines.join('\n');

    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rawData = results.data as Record<string, unknown>[];
          const items: ParsedItem[] = [];
          
          for (const row of rawData) {
            const parsedItem = processRow(row);
            if (parsedItem) items.push(parsedItem);
          }
          resolve(items);
        },
        error: () => reject(new Error('Gagal membaca file CSV.')),
      });
    });
  } catch {
    throw new Error('Gagal membaca file CSV.');
  }
}

function chunkText(text: string, maxChunkLength = 1000): ParsedItem[] {
  const paragraphs = text.split(/\n\s*\n/); // split by blank lines
  const items: ParsedItem[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    const cleanPara = para.trim();
    if (!cleanPara) continue;

    if ((currentChunk.length + cleanPara.length) > maxChunkLength && currentChunk.length > 0) {
      items.push({ searchableText: currentChunk });
      currentChunk = cleanPara;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + cleanPara;
    }
  }

  if (currentChunk.length > 0) {
    items.push({ searchableText: currentChunk });
  }

  return items;
}

export async function parsePdf(buffer: Buffer): Promise<ParsedItem[]> {
  try {
    const pdfParseModule = await import('pdf-parse');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParse = (pdfParseModule as any).default || pdfParseModule;
    const data = await pdfParse(buffer, { max: 50 }); // limit to 50 pages
    return chunkText(data.text);
  } catch {
    throw new Error('Gagal membaca file PDF.');
  }
}

export async function parseDocx(buffer: Buffer): Promise<ParsedItem[]> {
  try {
    const mammothModule = await import('mammoth');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mammoth = (mammothModule as any).default || mammothModule;
    const result = await mammoth.extractRawText({ buffer });
    return chunkText(result.value);
  } catch {
    throw new Error('Gagal membaca file DOCX.');
  }
}
