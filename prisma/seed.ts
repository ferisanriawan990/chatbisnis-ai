import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Default Plans
  const plans = [
    {
      name: 'Free',
      slug: 'free',
      priceMonthly: 0,
      maxWhatsappSessions: 1,
      maxKnowledgeItems: 20,
      dailyChatLimit: 30,
      monthlyChatLimit: 300,
      allowN8nTemplates: false,
      allowLeadCapture: false,
      allowHumanHandover: false,
      allowCustomApiKey: false,
    },
    {
      name: 'Starter',
      slug: 'starter',
      priceMonthly: 49000,
      maxWhatsappSessions: 1,
      maxKnowledgeItems: 100,
      dailyChatLimit: 200,
      monthlyChatLimit: 3000,
      allowN8nTemplates: true,
      allowLeadCapture: true,
      allowHumanHandover: true,
      allowCustomApiKey: false,
    },
    {
      name: 'Pro',
      slug: 'pro',
      priceMonthly: 149000,
      maxWhatsappSessions: 3,
      maxKnowledgeItems: 500,
      dailyChatLimit: 1000,
      monthlyChatLimit: 15000,
      allowN8nTemplates: true,
      allowLeadCapture: true,
      allowHumanHandover: true,
      allowCustomApiKey: true,
    },
    {
      name: 'Business',
      slug: 'business',
      priceMonthly: 399000,
      maxWhatsappSessions: 10,
      maxKnowledgeItems: 2000,
      dailyChatLimit: 5000,
      monthlyChatLimit: 100000,
      allowN8nTemplates: true,
      allowLeadCapture: true,
      allowHumanHandover: true,
      allowCustomApiKey: true,
    }
  ];

  for (const planData of plans) {
    await prisma.plan.upsert({
      where: { slug: planData.slug },
      update: planData,
      create: planData,
    });
    console.log(`Upserted Plan: ${planData.name}`);
  }

  // ─── Business Templates ───────────────────────────────
  const templates = [
    {
      name: 'Online Shop',
      slug: 'online-shop',
      category: 'E-Commerce',
      description: 'Template untuk toko online, marketplace, dan penjualan produk via WhatsApp.',
      systemPrompt: 'Kamu adalah CS toko online. Fokus menjawab pertanyaan tentang produk, stok, harga, ukuran, warna, ongkir, promo, cara order, metode pembayaran, pengiriman, retur, dan komplain sederhana. Jika customer ingin order, minta nama, produk yang diinginkan, jumlah, alamat, dan metode pembayaran.',
      requiredFields: JSON.stringify(['businessName', 'businessDescription', 'productsOrServices', 'pricingInfo', 'paymentMethods', 'deliveryMethods']),
      sampleQuestions: JSON.stringify([
        'Ada stok warna hitam?',
        'Berapa harga produk X?',
        'Ongkir ke Jakarta berapa?',
        'Cara ordernya gimana?',
        'Bisa COD gak?',
        'Kapan pesanan saya sampai?',
      ]),
    },
    {
      name: 'Jasa Service',
      slug: 'jasa-service',
      category: 'Jasa',
      description: 'Template untuk jasa service AC, elektronik, plumbing, atau reparasi lainnya.',
      systemPrompt: 'Kamu adalah CS jasa service. Fokus membantu customer menjelaskan keluhan, lokasi, jadwal kunjungan, estimasi biaya, area layanan, dan proses booking. Jika customer ingin booking, minta nama, nomor WhatsApp, alamat, keluhan, foto/video kerusakan bila ada, dan waktu kunjungan yang diinginkan.',
      requiredFields: JSON.stringify(['businessName', 'businessDescription', 'serviceArea', 'operationalHours', 'humanAdminContact']),
      sampleQuestions: JSON.stringify([
        'Bisa service AC di daerah X?',
        'Berapa biaya service kulkas?',
        'Bisa datang hari ini?',
        'Area layanan sampai mana?',
        'Garansi servicenya berapa lama?',
      ]),
    },
    {
      name: 'Restoran / Cafe',
      slug: 'restoran-cafe',
      category: 'F&B',
      description: 'Template untuk restoran, cafe, warung makan, dan catering.',
      systemPrompt: 'Kamu adalah CS restoran/cafe. Fokus menjawab menu, harga, promo, jam buka, lokasi, delivery, reservasi, dan paket acara. Jika customer ingin pesan, minta nama, menu, jumlah, alamat pengiriman atau jadwal reservasi.',
      requiredFields: JSON.stringify(['businessName', 'businessDescription', 'productsOrServices', 'pricingInfo', 'operationalHours', 'address']),
      sampleQuestions: JSON.stringify([
        'Menu apa aja?',
        'Bisa delivery ke daerah X?',
        'Ada promo hari ini?',
        'Bisa reservasi untuk 10 orang?',
        'Jam buka sampai jam berapa?',
        'Ada menu vegetarian?',
      ]),
    },
    {
      name: 'Klinik / Salon / Barbershop',
      slug: 'klinik-salon',
      category: 'Kesehatan & Kecantikan',
      description: 'Template untuk klinik kecantikan, salon, barbershop, dan spa.',
      systemPrompt: 'Kamu adalah CS layanan appointment. Fokus menjawab layanan, harga, jam praktik/jam buka, lokasi, promo, dan booking jadwal. Jangan memberi diagnosis medis. Untuk keluhan medis atau hal sensitif, arahkan ke admin atau tenaga profesional.',
      requiredFields: JSON.stringify(['businessName', 'businessDescription', 'productsOrServices', 'pricingInfo', 'operationalHours', 'address']),
      sampleQuestions: JSON.stringify([
        'Harga potong rambut berapa?',
        'Bisa booking jam 3 sore?',
        'Ada treatment facial gak?',
        'Dokternya praktek hari apa?',
        'Alamatnya di mana?',
      ]),
    },
    {
      name: 'Kos / Properti',
      slug: 'kos-properti',
      category: 'Properti',
      description: 'Template untuk kos-kosan, kontrakan, apartemen, dan properti sewa.',
      systemPrompt: 'Kamu adalah CS properti/kos. Fokus menjawab ketersediaan unit/kamar, harga sewa, fasilitas, lokasi, deposit, aturan sewa, dan jadwal survey. Jika customer ingin survey, minta nama, nomor WA, tanggal survey, dan kebutuhan unit.',
      requiredFields: JSON.stringify(['businessName', 'businessDescription', 'pricingInfo', 'address', 'humanAdminContact']),
      sampleQuestions: JSON.stringify([
        'Masih ada kamar kosong?',
        'Harga sewa per bulan berapa?',
        'Fasilitas apa aja?',
        'Boleh bawa hewan?',
        'Bisa survey besok?',
        'Deposit berapa?',
      ]),
    },
    {
      name: 'Rental / Travel',
      slug: 'rental-travel',
      category: 'Transportasi',
      description: 'Template untuk rental mobil/motor, travel, dan agen perjalanan.',
      systemPrompt: 'Kamu adalah CS rental/travel. Fokus menjawab ketersediaan kendaraan/paket, harga, rute, jadwal, syarat sewa, DP, dan booking. Jika customer ingin booking, minta nama, tanggal, tujuan, jumlah orang, dan jenis layanan.',
      requiredFields: JSON.stringify(['businessName', 'businessDescription', 'productsOrServices', 'pricingInfo', 'serviceArea']),
      sampleQuestions: JSON.stringify([
        'Sewa mobil Avanza per hari berapa?',
        'Ada paket wisata ke Bali?',
        'Syarat sewa apa aja?',
        'Bisa jemput di bandara?',
        'DP berapa persen?',
      ]),
    },
    {
      name: 'Kursus / Les / Bimbel',
      slug: 'kursus-bimbel',
      category: 'Pendidikan',
      description: 'Template untuk kursus, les privat, bimbel, dan pelatihan.',
      systemPrompt: 'Kamu adalah CS lembaga kursus. Fokus menjawab program belajar, biaya, jadwal, level, metode belajar online/offline, fasilitas, dan pendaftaran. Jika customer ingin daftar, minta nama, usia/kelas, program yang dipilih, dan nomor WA.',
      requiredFields: JSON.stringify(['businessName', 'businessDescription', 'productsOrServices', 'pricingInfo', 'operationalHours']),
      sampleQuestions: JSON.stringify([
        'Ada kursus bahasa Inggris?',
        'Biaya per bulan berapa?',
        'Bisa les online?',
        'Jadwal kelasnya kapan?',
        'Untuk anak SD bisa?',
        'Ada trial class gratis?',
      ]),
    },
    {
      name: 'Toko Offline / Retail',
      slug: 'toko-retail',
      category: 'Retail',
      description: 'Template untuk toko fisik, minimarket, toko bangunan, dan retail.',
      systemPrompt: 'Kamu adalah CS toko retail. Fokus menjawab stok barang, harga, lokasi toko, jam buka, promo, metode pembayaran, dan ketersediaan produk. Jika customer ingin datang ke toko, berikan alamat, jam buka, dan link maps.',
      requiredFields: JSON.stringify(['businessName', 'businessDescription', 'operationalHours', 'address', 'paymentMethods']),
      sampleQuestions: JSON.stringify([
        'Ada stok semen merek X?',
        'Jam buka sampai jam berapa?',
        'Bisa bayar pakai QRIS?',
        'Alamat tokonya di mana?',
        'Ada promo akhir bulan?',
      ]),
    },
    {
      name: 'Jasa Digital',
      slug: 'jasa-digital',
      category: 'Digital & Teknologi',
      description: 'Template untuk jasa pembuatan website, desain grafis, digital marketing, dan IT.',
      systemPrompt: 'Kamu adalah CS jasa digital. Fokus menjawab layanan seperti pembuatan website, desain, iklan, SEO, chatbot, social media management, harga paket, estimasi pengerjaan, dan konsultasi. Jika customer tertarik, minta nama, jenis bisnis, kebutuhan, budget, dan deadline.',
      requiredFields: JSON.stringify(['businessName', 'businessDescription', 'productsOrServices', 'pricingInfo', 'humanAdminContact']),
      sampleQuestions: JSON.stringify([
        'Harga buat website company profile?',
        'Bisa kelola Instagram bisnis saya?',
        'Paket iklan Google Ads mulai berapa?',
        'Berapa lama pengerjaan website?',
        'Ada portfolio?',
      ]),
    },
    {
      name: 'Custom Template',
      slug: 'custom',
      category: 'Custom',
      description: 'Template fleksibel untuk jenis usaha yang belum tercakup template lain. Anda bisa menuliskan instruksi khusus.',
      systemPrompt: 'Gunakan instruksi khusus dari user sebagai template utama. Tetap patuhi base system prompt global dan safety rules. Jangan keluar dari konteks bisnis user.',
      requiredFields: JSON.stringify(['businessName', 'businessDescription']),
      sampleQuestions: JSON.stringify([
        'Apa layanan yang tersedia?',
        'Berapa harganya?',
        'Bisa hubungi admin?',
      ]),
    },
  ];

  for (const tmpl of templates) {
    await prisma.businessTemplate.upsert({
      where: { slug: tmpl.slug },
      update: tmpl,
      create: tmpl,
    });
    console.log(`Upserted Template: ${tmpl.name}`);
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
