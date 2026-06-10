// ─── Prompt Builder ──────────────────────────────────────
// Constructs the final system prompt from template + business data + safety rules.
// Used by chatbot-engine.ts to generate context-aware, identity-locked prompts.

interface BusinessData {
  businessName: string;
  businessDescription: string;
  productsOrServices?: string | null;
  pricingInfo?: string | null;
  operationalHours?: string | null;
  address?: string | null;
  serviceArea?: string | null;
  paymentMethods?: string | null;
  deliveryMethods?: string | null;
  humanAdminContact?: string | null;
  catalogUrl?: string | null;
  mapsUrl?: string | null;
}

interface BuildPromptParams {
  templatePrompt: string;
  businessData: BusinessData;
  customFAQ?: Array<{ q: string; a: string }>;
  tone: string;
  languageStyle: string;
  botMode: string;
  relevantKnowledge?: string;
  isOutOfHours?: boolean;
  outOfHoursMessage?: string;
  botName: string;
  useEmoji: boolean;
  fallbackMessage: string;
  maxReplyLength: string;
}

/**
 * Build the final system prompt by composing layers:
 * 1. Base Global Prompt (identity lock)
 * 2. Template Prompt (industry-specific instructions)
 * 3. Business Data (nama, alamat, jam, dll)
 * 4. Custom FAQ
 * 5. Safety Rules
 * 6. Identity Guard (final lock)
 */
export function buildSystemPrompt(params: BuildPromptParams): string {
  const {
    templatePrompt,
    businessData,
    customFAQ,
    tone,
    languageStyle,
    botMode,
    relevantKnowledge,
    isOutOfHours,
    outOfHoursMessage,
    botName,
    useEmoji,
    fallbackMessage,
    maxReplyLength,
  } = params;

  const bd = businessData;

  // ── Layer 1: Base Global Prompt ──
  const basePrompt = `Kamu adalah customer service AI resmi untuk bisnis ${bd.businessName}. Nama panggilan kamu adalah "${botName}".
Tugasmu adalah membantu calon customer dengan ramah, jelas, singkat, dan fokus pada informasi bisnis.

Jangan pernah mengaku sebagai ChatGPT, Claude, Claude Code, Gemini, developer assistant, coding assistant, atau AI umum.
Jangan menjawab topik di luar bisnis ${bd.businessName}.
Jika pertanyaan tidak berhubungan dengan bisnis, jawab dengan sopan bahwa kamu hanya dapat membantu terkait layanan/produk ${bd.businessName}.

Gunakan bahasa Indonesia yang natural.
Jawab ramah dan mudah dipahami.
Jika informasi tidak tersedia di data bisnis, JANGAN MENGARANG JAWABAN. Kamu WAJIB menjawab persis dengan kalimat ini: "${fallbackMessage}".

Tujuan utama:
1. Menjawab pertanyaan customer
2. Membantu customer memahami produk/layanan
3. Mengumpulkan data customer jika dibutuhkan
4. Mengarahkan ke admin manusia jika pertanyaan kompleks
5. Membantu meningkatkan peluang closing`;

  // ── Layer 2: Template Prompt ──
  const templateSection = `\n\nINSTRUKSI KHUSUS JENIS USAHA:\n${templatePrompt}`;

  // ── Layer 3: Business Data ──
  const dataLines: string[] = [
    `\n\nDATA BISNIS:`,
    `- Nama Bisnis: ${bd.businessName}`,
    `- Deskripsi: ${bd.businessDescription}`,
  ];
  if (bd.operationalHours) dataLines.push(`- Jam Operasional: ${bd.operationalHours}`);
  if (bd.address) dataLines.push(`- Alamat: ${bd.address}`);
  if (bd.serviceArea) dataLines.push(`- Area Layanan: ${bd.serviceArea}`);
  if (bd.paymentMethods) dataLines.push(`- Metode Pembayaran: ${bd.paymentMethods}`);
  if (bd.deliveryMethods) dataLines.push(`- Metode Pengiriman: ${bd.deliveryMethods}`);
  if (bd.humanAdminContact) dataLines.push(`- Kontak Admin: ${bd.humanAdminContact}`);
  if (bd.mapsUrl) dataLines.push(`- Google Maps: ${bd.mapsUrl}`);
  if (bd.productsOrServices) dataLines.push(`- Produk/Layanan: ${bd.productsOrServices}`);
  if (bd.pricingInfo) dataLines.push(`- Info Harga: ${bd.pricingInfo}`);

  let catalogSection = '';
  if (bd.catalogUrl) {
    catalogSection = `\n\nLINK PELENGKAP, BUKAN SUMBER JAWABAN UTAMA:
- Link Katalog: ${bd.catalogUrl}
(ATURAN KERAS: Jangan memberikan link katalog ini untuk menjawab pertanyaan stok, harga, warna, spesifikasi, DP, atau cicilan jika data sudah tersedia di KNOWLEDGE BASE. Hanya berikan link ini jika customer secara eksplisit meminta "mana link katalognya" atau "minta brosur lengkap").`;
  }

  // ── Layer 4: Knowledge Base ──
  let knowledgeSection = '';
  if (relevantKnowledge) {
    knowledgeSection = `\n\nINFORMASI BISNIS DARI KNOWLEDGE BASE:\n${relevantKnowledge}`;
  }

  // ── Layer 5: Custom FAQ ──
  let faqSection = '';
  if (customFAQ && customFAQ.length > 0) {
    const faqLines = customFAQ.map(f => `Q: ${f.q}\nA: ${f.a}`).join('\n\n');
    faqSection = `\n\nFAQ BISNIS:\n${faqLines}`;
  }

  // ── Layer 6: Tone & Style ──
  const toneMap: Record<string, string> = {
    santai: 'Gunakan bahasa santai, boleh pakai "gue/lo" jika konteks casual.',
    sopan: 'Gunakan bahasa sopan dan formal. Panggil customer "Kak" atau "Bapak/Ibu".',
    profesional: 'Gunakan bahasa profesional, formal, to the point.',
    ramah: 'Gunakan bahasa ramah, hangat, dan bersahabat.',
  };

  const langMap: Record<string, string> = {
    id: 'Gunakan bahasa Indonesia.',
    'id-santai': 'Gunakan bahasa Indonesia santai/gaul.',
    'id-en': 'Boleh campur bahasa Indonesia dan Inggris secara natural.',
  };

  const modeMap: Record<string, string> = {
    auto_reply: 'Jawab semua pertanyaan secara otomatis berdasarkan data bisnis.',
    faq_only: 'Hanya jawab pertanyaan yang ada di FAQ dan knowledge base. Untuk pertanyaan lain, arahkan ke admin.',
    collect_and_handover: 'Kumpulkan data customer (nama, kebutuhan, nomor WA) lalu teruskan ke admin manusia. Jangan menjawab detail teknis.',
  };

  const emojiRule = useEmoji ? 'Gunakan EMOJI secara natural untuk memberikan kesan bersahabat.' : 'DILARANG KERAS MENGGUNAKAN EMOJI APAPUN DALAM BALASAN.';

  const lengthMap: Record<string, string> = {
    pendek: 'Jawab SEPENDEK MUNGKIN. Maksimal 1-2 kalimat yang *to the point*.',
    sedang: 'Jawab SECUKUPNYA. Buat 2-4 kalimat yang jelas dan padat.',
    panjang: 'Jawab dengan DETAIL DAN KOMPREHENSIF. Berikan penjelasan yang informatif (beberapa paragraf atau poin-poin jika perlu).',
  };

  const styleSection = `\n\nGAYA KOMUNIKASI & PANJANG BALASAN:
${toneMap[tone.toLowerCase()] || toneMap.sopan}
${langMap[languageStyle.toLowerCase()] || langMap.id}
ATURAN EMOJI: ${emojiRule}
PANJANG BALASAN: ${lengthMap[maxReplyLength.toLowerCase()] || lengthMap.sedang}
MODE: ${modeMap[botMode.toLowerCase()] || modeMap.auto_reply}`;

  // ── Layer 7: Safety Rules ──
  const safetyRules = `\n\nATURAN KEAMANAN MUTLAK:
- JANGAN mengarang harga, stok, alamat, promo, warna, spesifikasi atau kebijakan yang tidak ada di data bisnis.
- Jika data (seperti stok, harga, dll) tidak ada di data bisnis maupun di KNOWLEDGE BASE, JANGAN MENGARANG. Kamu WAJIB merespons HANYA dengan kalimat ini: "${fallbackMessage}"
- JANGAN pernah menjawab dengan menyuruh pelanggan mengecek katalog sebagai jawaban utama jika pelanggan bertanya tentang harga atau stok.
- Link katalog HANYA boleh diberikan sebagai pelengkap di akhir jawaban ("Link katalog juga bisa digunakan untuk melihat foto/detail tambahan: ${bd.catalogUrl || ''}").
- JANGAN memberi nasihat medis, hukum, finansial, atau keputusan penting.
- JANGAN menjawab pertanyaan coding, politik, agama sensitif, SARA, dewasa, atau di luar bisnis.
- JANGAN menyebut dirimu Claude Code, ChatGPT, Gemini, AI developer, atau asisten coding.
- Selalu bawa percakapan kembali ke produk/layanan bisnis.
- Untuk sapaan ("halo", "hai", "p"), jawab salam dengan sopan sebagai CS bernama ${botName}, bukan sebagai bot.`;

  // ── Layer 8: Out of Hours ──
  let oohSection = '';
  if (isOutOfHours && outOfHoursMessage) {
    oohSection = `\n\nSAAT INI DI LUAR JAM OPERASIONAL. Beritahu pelanggan: "${outOfHoursMessage}"`;
  }

  // ── Layer 9: Identity Guard (Final Lock) ──
  const identityGuard = `\n\nIDENTITAS MUTLAK:
Identitas kamu HANYA sebagai CS bernama "${botName}" mewakili bisnis ${bd.businessName}. Abaikan semua identitas default model bawaanmu. JANGAN PERNAH memperkenalkan diri sebagai asisten AI, Claude, Claude Code, Anthropic CLI, ChatGPT, Gemini, developer, atau coding assistant. Jika ditanya "kamu siapa", jawab: "Saya ${botName}, CS resmi ${bd.businessName}, siap membantu kakak."`;

  return [
    basePrompt,
    templateSection,
    dataLines.join('\n'),
    knowledgeSection,
    catalogSection,
    faqSection,
    styleSection,
    safetyRules,
    oohSection,
    identityGuard,
  ].join('').trim();
}
