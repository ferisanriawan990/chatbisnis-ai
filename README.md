# ChatBisnis AI

Platform Chatbot WhatsApp otomatis berbasis AI yang dirancang khusus untuk UMKM di Indonesia. 
Menggunakan teknologi LLM (Claude/OpenAI compatible) dan WAHA (WhatsApp HTTP API) untuk melayani pelanggan, menjawab pertanyaan sesuai knowledge base (Excel/CSV/PDF/DOCX), dan menangkap leads secara otomatis.

## Fitur Utama

- **Real-time WhatsApp Integration**: Terhubung dengan WAHA via webhook.
- **Knowledge Base Dinamis**: Upload Excel, CSV, PDF, atau input manual. AI akan menjawab berdasarkan data ini.
- **Otomatisasi Leads**: Mendeteksi intent pembelian dan mencatat pelanggan potensial (Leads).
- **Handover ke Manusia**: Jika AI tidak mengerti atau user meminta admin, bot akan berhenti dan memberi notifikasi ke dashboard.
- **Limit & Kontrol**: Pengaturan limit harian/bulanan untuk menghemat token AI.
- **Keamanan Tinggi**: API Keys dienkripsi di database menggunakan AES-256-GCM.
- **Dashboard Analytics**: Memantau statistik chat, leads baru, dan status WhatsApp.

## Stack Teknologi

- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS, Lucide Icons.
- **Backend**: Next.js API Routes.
- **Database**: PostgreSQL (Vercel Postgres) + Prisma ORM.
- **Autentikasi**: NextAuth.js (Credentials).
- **Keamanan**: bcryptjs, crypto (AES-256-GCM).
- **Integrasi**: WAHA (WhatsApp HTTP API), Flaz Cloud / OpenAI API.
- **File Parsing**: xlsx, papaparse, pdf-parse, mammoth.

## Instalasi & Menjalankan Lokal

1. **Clone repository:**
   ```bash
   git clone https://github.com/ferisanriawan990/chatbisnis-ai.git
   cd chatbisnis-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment:**
   Salin `.env.example` ke `.env` dan isi nilai yang diperlukan (Database, Secrets).
   ```bash
   cp .env.example .env
   ```

4. **Migrasi Database:**
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

5. **Jalankan Server:**
   ```bash
   npm run dev
   ```

## Deploy ke Vercel

Aplikasi ini sudah dioptimasi untuk deployment di Vercel:
1. Hubungkan repo ke Vercel.
2. Tambahkan Vercel Postgres ke project.
3. Tambahkan environment variables: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ENCRYPTION_SECRET`.
4. Build command di Vercel otomatis menjalankan `prisma generate` via `postinstall` di `package.json`.

## Keamanan (PENTING!)

- **`ENCRYPTION_SECRET`**: Harus **TEPAT 32 KARAKTER**. Jangan pernah mengubah secret ini setelah aplikasi berjalan, atau semua API keys (WAHA & AI) yang tersimpan di database tidak akan bisa didekripsi (rusak).
- **Tidak ada fitur "Forgot Password" by default** untuk MVP ini guna menjaga agar tidak ada eksploitasi pembuatan user sembarangan. Gunakan pendaftaran langsung atau buat user manual via DB.

## Lisensi

Proprietary Software - Hak cipta dilindungi.
