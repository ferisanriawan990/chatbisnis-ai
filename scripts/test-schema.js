const { z } = require('zod');

const businessProfileSchema = z.object({
  businessName: z.string().min(1, 'Nama bisnis wajib diisi').max(200),
  businessIndustry: z.string().min(1, 'Bidang usaha wajib diisi').max(100),
  businessDescription: z.string().max(2000).optional().default(''),
  address: z.string().max(500).optional().default(''),
  openingHours: z.string().max(100).optional().default('08:00 - 17:00'),
  adminPhone: z.string().max(20).optional().default(''),
  websiteUrl: z.string().url().optional().or(z.literal('')).nullable(),
  instagramUrl: z.string().max(200).optional().or(z.literal('')).nullable(),
  marketplaceUrl: z.string().max(200).optional().or(z.literal('')).nullable(),
});

const chatbotSettingSchema = z.object({
  botName: z.string().min(1, 'Nama bot wajib diisi').max(100),
  toneStyle: z.enum(['Profesional', 'Ramah', 'Santai', 'Sales / Soft Selling']).default('Profesional'),
  language: z.enum(['id', 'en']).default('id'),
  useEmoji: z.boolean().default(true),
  maxReplyLength: z.enum(['pendek', 'sedang', 'panjang']).default('sedang'),
  allowSelling: z.boolean().default(true),
  allowPromoOffer: z.boolean().default(true),
  fallbackMessage: z.string().max(1000).default('Mohon maaf, saya tidak mengerti.'),
  handoverMessage: z.string().max(1000).default('Baik, saya akan menyambungkan Anda dengan admin kami.'),
  handoverKeywords: z.string().max(500).default('admin, cs, manusia'),
  outOfHoursMessage: z.string().max(1000).default('Mohon maaf, saat ini kami sedang di luar jam operasional.'),
  aiProvider: z.string().max(100).default('Flaz Cloud'),
  aiModel: z.string().max(100).default('gpt-4o-mini'),
  aiApiKey: z.string().max(500).optional().or(z.literal('')).or(z.literal('••••••••')),
  dailyChatLimit: z.coerce.number().int().min(1).max(100000).default(1000),
  monthlyChatLimit: z.coerce.number().int().min(1).max(10000000).default(30000),
  n8nWebhookUrl: z.string().url().optional().or(z.literal('')).nullable(),
  templateId: z.string().optional().nullable(),
});

const saveChatbotSchema = businessProfileSchema.merge(chatbotSettingSchema);

const sampleForm = {
  businessName: 'Goda Official Tigaraksa',
  businessIndustry: 'Toko Offline / Retail',
  businessDescription: 'Desc',
  address: 'Jl',
  openingHours: '00:00 - 00:00',
  adminPhone: '0812',
  websiteUrl: '',
  instagramUrl: '',
  marketplaceUrl: '',
  botName: 'Bot',
  toneStyle: 'Profesional',
  language: 'id',
  useEmoji: true,
  maxReplyLength: 'sedang',
  allowSelling: true,
  allowPromoOffer: true,
  fallbackMessage: 'Fallback',
  handoverMessage: 'Handover',
  handoverKeywords: 'admin',
  outOfHoursMessage: 'Out',
  aiProvider: 'Flaz Cloud',
  aiModel: 'gpt-4o-mini',
  aiApiKey: '',
  dailyChatLimit: 1000,
  monthlyChatLimit: 30000,
  isActive: false,
  templateId: 'some-id'
};

const result = saveChatbotSchema.safeParse(sampleForm);
if (!result.success) {
  console.log(result.error.issues);
} else {
  console.log("Success!");
}
