import { z } from 'zod/v4';

// ─── Auth Schemas ────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  email: z.email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter').max(128),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Konfirmasi password tidak cocok',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

// ─── Business Profile Schema ────────────────────────────

export const businessProfileSchema = z.object({
  businessName: z.string().min(1, 'Nama bisnis wajib diisi').max(200),
  businessIndustry: z.string().min(1, 'Bidang usaha wajib diisi').max(100),
  businessDescription: z.string().max(2000).optional().default(''),
  address: z.string().max(500).optional().default(''),
  openingHours: z.string().max(100).optional().default('08:00 - 17:00'),
  adminPhone: z.string().max(20).optional().default(''),
  websiteUrl: z.string().url().optional().or(z.literal('')).nullable(),
  instagramUrl: z.string().max(200).optional().or(z.literal('')).nullable(),
  marketplaceUrl: z.string().max(200).optional().or(z.literal('')).nullable(),
  customLinks: z.array(z.object({
    title: z.string().min(1, 'Judul link wajib diisi'),
    url: z.string().url('URL tidak valid'),
  })).optional().nullable(),
});

// ─── Chatbot Setting Schema ─────────────────────────────

export const chatbotSettingSchema = z.object({
  botName: z.string().min(1, 'Nama bot wajib diisi').max(100),
  // NOTE: isActive intentionally excluded — use /api/dashboard/chatbot/toggle instead
  toneStyle: z.enum(['Profesional', 'Ramah', 'Santai', 'Sales / Soft Selling']).default('Profesional'),
  language: z.enum(['id', 'en']).default('id'),
  useEmoji: z.boolean().default(true),
  maxReplyLength: z.enum(['pendek', 'sedang', 'panjang']).default('sedang'),
  allowSelling: z.boolean().default(true),
  allowPromoOffer: z.boolean().default(true),
  allowVision: z.boolean().default(false),
  fallbackMessage: z.string().max(1000).default('Mohon maaf, saya tidak mengerti.'),
  handoverMessage: z.string().max(1000).default('Baik, saya akan menyambungkan Anda dengan admin kami.'),
  handoverKeywords: z.string().max(500).default('admin, cs, manusia'),
  outOfHoursMessage: z.string().max(1000).default('Mohon maaf, saat ini kami sedang di luar jam operasional.'),
  aiProvider: z.literal('Flaz Cloud').default('Flaz Cloud'),
  aiModel: z.string().max(100).default('gpt-4o-mini'),
  dailyChatLimit: z.coerce.number().int().min(1).max(100000).default(1000),
  monthlyChatLimit: z.coerce.number().int().min(1).max(10000000).default(30000),
  historyMessageCount: z.coerce.number().int().min(2).max(50).default(6),
  knowledgeCharLimit: z.coerce.number().int().min(1000).max(20000).default(3500),
  actionWebhookUrl: z.string().url().optional().or(z.literal('')).nullable(),
  templateId: z.string().optional().nullable(),
  // Advanced bot config fields
  productsOrServices: z.string().max(2000).optional().nullable(),
  pricingInfo: z.string().max(2000).optional().nullable(),
  paymentMethods: z.string().max(1000).optional().nullable(),
  deliveryMethods: z.string().max(1000).optional().nullable(),
  serviceArea: z.string().max(1000).optional().nullable(),
  catalogUrl: z.string().url().optional().or(z.literal('')).nullable(),
  mapsUrl: z.string().url().optional().or(z.literal('')).nullable(),
  customFAQ: z.string().optional().nullable(),
});

// ─── Combined Save Schema ───────────────────────────────

export const saveChatbotSchema = businessProfileSchema.merge(chatbotSettingSchema);

// ─── Knowledge Manual Schema ────────────────────────────

export const manualKnowledgeSchema = z.object({
  type: z.enum(['qa', 'product']),
  question: z.string().max(1000).optional(),
  answer: z.string().max(5000).optional(),
  productName: z.string().max(200).optional(),
  productCategory: z.string().max(100).optional(),
  price: z.coerce.number().min(0).optional(),
  stockStatus: z.string().max(50).optional(),
  description: z.string().max(5000).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')).nullable(),
}).superRefine((data, ctx) => {
  if (data.type === 'qa') {
    if (!data.question?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Pertanyaan wajib diisi', path: ['question'] });
    }
    if (!data.answer?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Jawaban wajib diisi', path: ['answer'] });
    }
  } else if (data.type === 'product') {
    if (!data.productName?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Nama produk wajib diisi', path: ['productName'] });
    }
    if (!data.description?.trim() && !data.price) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Minimal isi deskripsi atau harga', path: ['description'] });
    }
  }
});

// ─── Internal API Schemas ───────────────────────────────

export const internalLogSchema = z.object({
  wahaSessionName: z.string().min(1),
  customerPhone: z.string().min(1),
  customerName: z.string().optional().nullable(),
  messageIn: z.string().min(1),
  messageOut: z.string().optional().nullable(),
  intent: z.string().optional().nullable(),
  aiUsed: z.string().optional().nullable(),
  status: z.enum(['success', 'failed']).default('success'),
  errorMessage: z.string().optional().nullable(),
  needsHuman: z.boolean().optional().default(false),
  tokenUsage: z.coerce.number().int().min(0).optional().default(0),
});

export const internalLeadSchema = z.object({
  wahaSessionName: z.string().min(1),
  customerPhone: z.string().min(1),
  customerName: z.string().optional().nullable(),
  interest: z.string().optional().nullable(),
  budget: z.coerce.number().min(0).optional().nullable(),
  address: z.string().optional().nullable(),
  status: z.enum(['cold', 'warm', 'hot', 'converted', 'lost']).optional().default('cold'),
  notes: z.string().optional().nullable(),
});
