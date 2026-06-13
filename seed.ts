import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');

  // 1. Seed Plans
  const plans = [
    {
      name: 'Free Trial',
      slug: 'free',
      priceMonthly: 0,
      maxWhatsappSessions: 1,
      maxKnowledgeItems: 5,
      dailyChatLimit: 50,
      monthlyChatLimit: 1000,
      allowLeadCapture: false,
      allowHumanHandover: false,
      isActive: true,
    },
    {
      name: 'Pro',
      slug: 'pro',
      priceMonthly: 99000,
      maxWhatsappSessions: 2,
      maxKnowledgeItems: 25,
      dailyChatLimit: 500,
      monthlyChatLimit: 15000,
      allowLeadCapture: true,
      allowHumanHandover: true,
      isActive: true,
    },
    {
      name: 'Enterprise',
      slug: 'enterprise',
      priceMonthly: 249000,
      maxWhatsappSessions: 5,
      maxKnowledgeItems: 100,
      dailyChatLimit: 3000,
      monthlyChatLimit: 90000,
      allowLeadCapture: true,
      allowHumanHandover: true,
      isActive: true,
    }
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
  }
  console.log('✅ Plans seeded');

  // 2. Seed Templates
  const templates = [
    {
      name: 'Kedai Kopi / F&B',
      slug: 'fnb-kopi',
      category: 'F&B',
      description: 'Template khusus untuk kafe, restoran, dan bisnis kuliner.',
      systemPrompt: 'Kamu adalah asisten virtual ramah yang melayani pelanggan restoran/kafe. Tugasmu adalah memberikan informasi menu, jam operasional, promo, dan menerima pesanan. Selalu gunakan bahasa yang sopan, santai, dan ramah.',
      requiredFields: JSON.stringify(['Nama Toko', 'Jam Buka', 'Menu Unggulan', 'Metode Pembayaran']),
      sampleQuestions: JSON.stringify(['Buka jam berapa hari ini?', 'Ada menu kopi susu aren?', 'Bisa pesan antar?']),
      isActive: true,
    },
    {
      name: 'Klinik Kecantikan & Skincare',
      slug: 'klinik-skincare',
      category: 'Beauty',
      description: 'Asisten virtual untuk konsultasi jadwal dan info perawatan klinik kecantikan.',
      systemPrompt: 'Kamu adalah asisten/konsultan kecantikan yang ramah. Jawab pertanyaan seputar treatment, jam praktik dokter, dan harga promo. Berikan kesan yang profesional, sabar, dan empati. Arahkan pasien untuk booking jika mereka tertarik.',
      requiredFields: JSON.stringify(['Nama Klinik', 'Daftar Treatment', 'Jam Buka', 'Kontak Booking']),
      sampleQuestions: JSON.stringify(['Berapa harga facial jerawat?', 'Dokter kulit ada hari apa aja?', 'Mau booking untuk besok bisa?']),
      isActive: true,
    },
    {
      name: 'Toko Pakaian / Fashion',
      slug: 'fashion-apparel',
      category: 'Retail',
      description: 'Template untuk melayani penjualan baju, sepatu, dan aksesoris.',
      systemPrompt: 'Kamu adalah asisten toko fashion yang gaul dan komunikatif. Bantu pelanggan memilih ukuran, merekomendasikan warna, mengecek ketersediaan pakaian, dan memberikan informasi pengiriman. Gunakan sapaan akrab seperti "Kak".',
      requiredFields: JSON.stringify(['Nama Brand', 'Link Shopee/Tokopedia', 'Jam Operasional CS', 'Kebijakan Retur']),
      sampleQuestions: JSON.stringify(['Kak, kaos warna hitam size XL ready?', 'Pengiriman dari mana?', 'Kalo kebesaran bisa ditukar?']),
      isActive: true,
    },
    {
      name: 'Jasa Servis AC & Elektronik',
      slug: 'servis-ac',
      category: 'Jasa',
      description: 'Template untuk teknisi dan jasa perbaikan panggilan.',
      systemPrompt: 'Kamu adalah admin jasa servis AC dan elektronik. Kamu responsif, profesional, dan to the point. Jawab pertanyaan seputar biaya layanan, area cakupan teknisi, dan jadwalkan kunjungan servis jika pelanggan meminta.',
      requiredFields: JSON.stringify(['Area Layanan', 'Daftar Harga', 'Waktu Operasional', 'Kontak Teknisi']),
      sampleQuestions: JSON.stringify(['Bisa perbaiki AC netes air di daerah Jakarta Selatan?', 'Biaya cuci AC berapa?', 'Besok pagi ada teknisi kosong?']),
      isActive: true,
    }
  ];

  for (const tpl of templates) {
    await prisma.businessTemplate.upsert({
      where: { slug: tpl.slug },
      update: tpl,
      create: tpl,
    });
  }
  console.log('✅ Templates seeded');

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
