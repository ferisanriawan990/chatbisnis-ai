# ChatBisnis AI

SaaS Platform Chatbot WhatsApp berbasis AI yang dirancang khusus untuk UMKM di Indonesia. 
Menggunakan teknologi LLM (Claude/OpenAI) dan **WAHA (WhatsApp HTTP API)** untuk melayani pelanggan secara otomatis, merespon sesuai *Knowledge Base* (Excel, CSV, PDF, DOCX, Manual), dan mengotomatisasi *Lead Capture*.

## Status Proyek
✅ **MVP Production Ready** 

Seluruh endpoint Admin dan Dashboard telah diamankan, flow WAHA telah diproteksi dengan mekanisme *transactional*, dan seluruh respons API telah dienkripsi sesuai standar keamanan produksi tingkat tinggi.

---

## Panduan Instalasi & Deployment

### 1. Cara Instalasi Lokal / Vercel
Lakukan instruksi berikut secara berurutan untuk menghindari isu dependensi:

```bash
# 1. Pastikan Anda menginstall dependensi persis dari package-lock.json
npm ci

# 2. Siapkan file environment variables (lihat referensi di bawah)
cp .env.example .env

# 3. Jalankan migrasi database
npx prisma generate
npx prisma migrate deploy

# 4. (Opsional jika ada file seed)
npx prisma db seed

# 5. Bangun project untuk memastikan tidak ada error build
npm run build

# 6. Mulai server
npm run start
```

### 2. Environment Variables yang Wajib Diisi
Selalu gunakan *Vercel Environment Variables* di production. **JANGAN PERNAH** commit `.env` ke repository.

| Key | Deskripsi Wajib |
|---|---|
| `DATABASE_URL` | String koneksi Vercel Postgres / Supabase. |
| `NEXTAUTH_URL` | Biarkan kosong atau set ke domain Vercel. |
| `NEXTAUTH_SECRET` | String rahasia acak untuk JWT (min 32 karakter). |
| `NEXT_PUBLIC_APP_URL` | Domain utama aplikasi (Contoh: `https://chatbisnis.ai`). Wajib untuk SEO & Webhook. |
| `ENCRYPTION_SECRET` | **KRITIS: HARUS TEPAT 32 KARAKTER.** Digunakan untuk enkripsi API Key di DB. Jangan diubah setelah production atau kunci di DB akan rusak. |
| `WAHA_WEBHOOK_SECRET` | String rahasia yang mengamankan validasi webhook dari WAHA / n8n ke Vercel. |
| `ADMIN_EMAIL` | Email untuk initial login super admin. |
| `ADMIN_PASSWORD` | Password (min 12 karakter disarankan) untuk super admin. |
| `ADMIN_NAME` | Nama tampilan super admin. |

### 3. Setup Akun Admin Pertama (Super Admin)
Agar Anda dapat mengakses Dashboard Super Admin (URL: `/admin`), Anda perlu menjalankan skrip otomatis.

1. Isi `ADMIN_EMAIL`, `ADMIN_PASSWORD`, dan `ADMIN_NAME` di `.env` lokal Anda (atau Vercel Env saat build).
2. Jalankan skrip berikut menggunakan ts-node atau jalankan di environment development:
   ```bash
   npx ts-node scripts/create-admin.ts
   ```
   *(Atau secara manual ubah *role* user Anda dari `USER` menjadi `ADMIN` langsung lewat klien Database).*

### 4. Setup Server WAHA (WhatsApp HTTP API)
ChatBisnis AI tidak menyimpan engine WhatsApp di dalam codebase ini. Anda wajib menyewa **VPS (Virtual Private Server)** untuk menjalankan WAHA Server:

1. Sewa VPS (Ubuntu) di DigitalOcean/AWS/Contabo.
2. Install Docker.
3. Jalankan container WAHA Plus:
   ```bash
   docker run -d -it -p 3000:3000/tcp \
     -e WHATSAPP_DEFAULT_ENGINE=WEBJS \
     --name waha-server \
     devlikeapro/waha-plus
   ```
4. Tambahkan proteksi API Key di WAHA server jika diperlukan.
5. Kembali ke Dashboard ChatBisnis AI. Buka menu **Admin > WAHA Servers**.
6. Tambahkan server baru, isi IP VPS / Domain WAHA Anda, masukkan API Key (opsional jika dikonfigurasi), lalu **Test Connection**.

### 5. Setup Global AI Key
Agar Chatbot Engine bisa memproses AI jika user tidak memiliki kunci sendiri:
1. Masuk ke **Admin > API Keys**.
2. Buat kredensial baru.
3. **PENTING**: Isi kolom `Key (Identifier)` secara presisi dengan teks: `FLAZ_API_KEY_GLOBAL`
4. Masukkan kunci API rahasia milik Anda. Kunci Anda akan dienkripsi dan tidak akan pernah ditampilkan di UI lagi.

### 6. Integrasi n8n (Opsional)
Bagi pengguna *Enterprise*, platform ini mendukung *routing* *Webhook* melalui **n8n**.
1. Berikan file template `public/WAHA_to_Vercel_n8n_Workflow.json` ke klien Anda untuk di-import di instalasi n8n mereka.
2. Instruksikan klien mengganti variabel `{{WEBSITE_API_BASE_URL}}` dengan domain SaaS utama Anda (misal `https://chatbisnis.ai`).
3. Instruksikan klien mengisi `{{WAHA_WEBHOOK_SECRET}}` dengan rahasia yang sama pada `.env` server Anda agar verifikasi sukses.
4. N8n akan mem-*forward* `raw json body` ke backend secara aman tanpa mengubah struktur bawaan WAHA.

---

## PERINGATAN KEAMANAN (CRITICAL)

- **Jangan Pernah Menyimpan Secret di Repo**: File seperti `.env`, file `get_qr.js` lokal yang memiliki kunci rahasia, maupun `.DS_Store` tidak boleh di-*commit*. Jika WAHA API Key Anda terlanjur masuk ke riwayat *commit*, Anda WAJIB mengganti WAHA API Key tersebut di sisi server secepatnya.
- **Hindari Commit QR Code**: Men-*generate* dan meng-*commit* file `qr.html` yang membawa *session* sensitif WhatsApp Anda sangat berisiko. Biarkan pengguna *scan* QR langsung melalui *Secure Dashboard* bawaan (melalui menu `/dashboard/waha`).
- **Enkripsi Kunci**: Semua API Keys tersimpan dalam format terenkripsi (Algoritma `AES-256-GCM`). Pastikan `ENCRYPTION_SECRET` Anda dicadangkan di tempat yang sangat aman.

---

*Hak Cipta © 2024 ChatBisnis AI. Seluruh fungsionalitas telah direkayasa ulang dengan standar keamanan enterprise.*
