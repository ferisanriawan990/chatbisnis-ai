# ChatBisnis AI

SaaS Platform Chatbot WhatsApp berbasis AI yang dirancang khusus untuk UMKM di Indonesia. 
Menggunakan teknologi LLM (Claude/OpenAI) dan **WAHA (WhatsApp HTTP API)** untuk melayani pelanggan secara otomatis, merespon sesuai *Knowledge Base* (Excel, CSV, PDF, DOCX, Manual), dan mengotomatisasi *Lead Capture*.

## Status Proyek
⚠️ **MVP Final Hardening / Belum production-ready sampai seluruh checklist security dan build lolos.**

---

## Panduan Instalasi & Deployment

### 1. Cara Instalasi Lokal / Vercel
Lakukan instruksi berikut secara berurutan untuk menghindari isu dependensi:

```bash
# 1. Pastikan Anda menginstall dependensi persis dari package-lock.json
npm ci

# 2. Siapkan file environment variables (lihat referensi di bawah)
cp .env.example .env
# Isi semua variabel yang diperlukan di file .env

# 3. Generate Prisma Client dan migrasi database
npx prisma generate
npx prisma migrate deploy

# 4. Jalankan seeder database
npx prisma db seed

# 5. Bangun project untuk memastikan tidak ada error build
npm run build

# 6. Mulai server
npm run start
```

### 2. Cara Setup Akun Admin Pertama (Super Admin)
Agar Anda dapat mengakses Dashboard Super Admin (URL: `/admin`):

1. Isi `ADMIN_EMAIL`, `ADMIN_PASSWORD`, dan `ADMIN_NAME` di `.env` lokal Anda (atau Vercel Env saat build).
2. Jalankan skrip berikut menggunakan ts-node atau jalankan di environment development:
   ```bash
   npx ts-node scripts/create-admin.ts
   ```

### 3. Cara Setup Server WAHA (WhatsApp HTTP API)
ChatBisnis AI tidak menyimpan engine WhatsApp di dalam codebase ini. Anda wajib menyewa **VPS** untuk menjalankan WAHA Server:

1. Admin login ke dashboard.
2. Buka menu **Admin > WAHA Servers**.
3. Tambah server baru, isi IP VPS / Domain WAHA Anda dan API Key (jika dikonfigurasi).
4. Klik **Test Connection**.
5. Setelah berhasil, user dapat membuka dashboard mereka, menuju menu WhatsApp, dan scan QR langsung dari sana.

### 4. Cara Setup Global AI Key
Agar Chatbot Engine bisa memproses pesan jika user tidak memiliki kunci AI sendiri:

1. Admin login dan masuk ke **Admin > API Keys**.
2. Buat kredensial baru.
3. **PENTING**: Isi kolom `Key (Identifier)` secara presisi dengan teks: `FLAZ_API_KEY_GLOBAL`
4. Masukkan kunci API rahasia milik Anda. Kunci Anda akan dienkripsi dan tidak akan pernah ditampilkan di UI lagi.

### 5. Integrasi n8n (Opsional)
Bagi pengguna *Enterprise*, platform ini mendukung *routing* *Webhook* melalui **n8n**.

1. Berikan file template `public/WAHA_to_Vercel_n8n_Workflow.json` ke klien Anda.
2. Instruksikan klien mengganti variabel `{{WEBSITE_API_BASE_URL}}` dengan domain SaaS utama Anda (misal `https://chatbisnis.ai`).
3. Instruksikan klien mengisi header `x-webhook-secret: {{WHATSAPP_WEBHOOK_SECRET}}` agar verifikasi sukses.
4. N8n akan mem-*forward* `raw json body` ke backend secara aman tanpa mengubah struktur bawaan WAHA.

---

## PERINGATAN KEAMANAN (CRITICAL)

- **Wajib Rotate WAHA API Key**: Jika WAHA API key Anda pernah masuk ke dalam *commit* repository (bocor), Anda **WAJIB** merotasi/mengganti API Key tersebut langsung di sisi VPS WAHA server Anda.
- **Wajib Unlink WhatsApp Device**: Jika QR Code (`qr.html`, `.png`, dsb) pernah masuk repo, segera lakukan unlink (keluar perangkat) dari aplikasi WhatsApp di HP Anda.
- **Wajib Set Env Production**: Sebelum melakukan deploy ke Vercel/VPS, seluruh variabel di `.env` WAJIB disiapkan di environment variables production. Jangan pernah menggunakan environment variables development/local.
- **Enkripsi Kunci**: Semua API Keys tersimpan dalam format terenkripsi. Pastikan `ENCRYPTION_SECRET` dicadangkan di tempat yang aman.

---

*Hak Cipta © 2024 ChatBisnis AI. Seluruh fungsionalitas telah direkayasa ulang dengan standar keamanan enterprise.*
