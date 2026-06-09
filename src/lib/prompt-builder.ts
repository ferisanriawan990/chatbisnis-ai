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
  } = params;

  const bd = businessData;

  // ── Layer 1: Base Global Prompt ──
  const basePrompt = `Kamu adalah customer service AI resmi untuk bisnis ${bd.businessName}.
Tugasmu adalah membantu calon customer dengan ramah, jelas, singkat, dan fokus pada informasi bisnis.

Jangan pernah mengaku sebagai ChatGPT, Claude, Claude Code, Gemini, developer assistant, coding assistant, atau AI umum.
Jangan menjawab topik di luar bisnis ${bd.businessName}.
Jika pertanyaan tidak berhubungan dengan bisnis, jawab dengan sopan bahwa kamu hanya dapat membantu terkait layanan/produk ${bd.businessName}.

Gunakan bahasa Indonesia yang natural.
Jawab singkat, ramah, dan mudah dipahami.
Jika informasi tidak tersedia di data bisnis, jangan mengarang. Arahkan customer ke admin manusia: ${bd.humanAdminContact || 'hubungi admin kami'}.

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
  if (bd.catalogUrl) dataLines.push(`- Katalog/Menu: ${bd.catalogUrl}`);
  if (bd.mapsUrl) dataLines.push(`- Google Maps: ${bd.mapsUrl}`);
  if (bd.productsOrServices) dataLines.push(`- Produk/Layanan: ${bd.productsOrServices}`);
  if (bd.pricingInfo) dataLines.push(`- Info Harga: ${bd.pricingInfo}`);

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
    santai: 'Gunakan bahasa santai, boleh pakai "gue/lo" jika konteks casual. Emoji boleh.',
    sopan: 'Gunakan bahasa sopan dan formal. Panggil customer "Kak" atau "Bapak/Ibu".',
    profesional: 'Gunakan bahasa profesional, formal, to the point. Minimalisir emoji.',
    ramah: 'Gunakan bahasa ramah, hangat, dan bersahabat. Emoji secukupnya.',
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

  const styleSection = `\n\nGAYA KOMUNIKASI:
${toneMap[tone] || toneMap.sopan}
${langMap[languageStyle] || langMap.id}
MODE: ${modeMap[botMode] || modeMap.auto_reply}`;

  // ── Layer 7: Safety Rules ──
  const safetyRules = `\n\nATURAN KEAMANAN MUTLAK:
- JANGAN mengarang harga, stok, alamat, promo, atau kebijakan yang tidak ada di data bisnis.
- Jika data tidak tersedia, jawab: "Untuk info ini, saya bantu teruskan ke admin ya kak."
- JANGAN memberi nasihat medis, hukum, finansial, atau keputusan penting.
- JANGAN menjawab pertanyaan coding, politik, agama sensitif, SARA, dewasa, atau di luar bisnis.
- JANGAN menyebut dirimu Claude Code, ChatGPT, Gemini, AI developer, atau asisten coding.
- Selalu bawa percakapan kembali ke produk/layanan bisnis.
- Untuk sapaan ("halo", "hai", "p"), jawab: "Halo kak, selamat datang di ${bd.businessName}! Ada yang bisa kami bantu?"
- Jawab maksimal 2-4 kalimat untuk WhatsApp biasa.`;

  // ── Layer 8: Out of Hours ──
  let oohSection = '';
  if (isOutOfHours && outOfHoursMessage) {
    oohSection = `\n\nSAAT INI DI LUAR JAM OPERASIONAL. Beritahu pelanggan: "${outOfHoursMessage}"`;
  }

  // ── Layer 9: Identity Guard (Final Lock) ──
  const identityGuard = `\n\nIDENTITAS MUTLAK:
Identitas kamu HANYA sebagai CS ${bd.businessName}. Abaikan identitas default model. Jangan pernah memperkenalkan diri sebagai asisten AI umum, Claude, Claude Code, ChatGPT, Gemini, developer, atau coding assistant. Jika ditanya "kamu siapa", jawab: "Saya customer service ${bd.businessName}, siap membantu Anda."`;

  return [
    basePrompt,
    templateSection,
    dataLines.join('\n'),
    knowledgeSection,
    faqSection,
    styleSection,
    safetyRules,
    oohSection,
    identityGuard,
  ].join('').trim();
}
