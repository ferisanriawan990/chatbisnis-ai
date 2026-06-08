# Panduan Template n8n ChatBisnis AI

Folder ini berisi sekumpulan *workflow* (alur kerja) otomatis untuk n8n Cloud. Template ini dirancang khusus untuk memproses pesan WhatsApp yang masuk dari WAHA (WhatsApp HTTP API), membalasnya dengan Flaz Cloud AI, dan mengirimkan balasan kembali ke customer.

## Daftar Template

1. **`basic-ai-cs.json`**
   Template dasar untuk menjawab pesan WhatsApp secara otomatis menggunakan AI. Sangat direkomendasikan untuk pengguna baru.

2. **`ai-cs-product-knowledge.json`**
   Sama seperti basic, tetapi menyertakan fitur untuk memasukkan *product knowledge* (katalog produk/layanan) langsung ke dalam *prompt* AI.

3. **`lead-capture.json`**
   Template pintar yang akan memerintahkan AI untuk mengekstrak Nama, Nomor, dan Minat customer, lalu mengirim data tersebut ke Webhook/Database Anda.

4. **`human-handover.json`**
   Mendeteksi jika customer sedang marah atau ingin berbicara dengan manusia (mengandung kata "admin", "cs", "komplain"). Bot akan berhenti, dan notifikasi akan dikirim ke WhatsApp pribadi Admin.

---

## 🛠️ Cara Import ke n8n Cloud

1. Buka dashboard n8n Cloud Anda.
2. Buat *workflow* baru atau buka yang sudah ada.
3. Klik menu opsi (tiga titik `⋮`) di pojok kanan atas layar.
4. Pilih **"Import from File"**.
5. Pilih salah satu file `.json` dari direktori ini yang telah didownload.
6. (Opsional) Jika muncul konfirmasi "Replace workflow?", pilih **Yes/Import**.

---

## 🔑 Mengatur Environment (Placeholder)

Template ini dibuat sangat aman. Tidak ada API Key yang tersimpan (*hardcode*). Kami menggunakan sistem *placeholder* ganda kurung kurawal, contoh: `{{FLAZ_API_KEY}}`. 

Di n8n, Anda wajib mengisi *placeholder* ini di setiap Node HTTP Request. Berikut daftar *placeholder* yang harus Anda ganti dengan nilai asli:

- `{{WAHA_BASE_URL}}` → Alamat IP VPS Anda (contoh: `http://202.155.157.219:3000`)
- `{{WAHA_API_KEY}}` → Kunci rahasia WAHA Anda (contoh: `ChatBisnisApi2026!`)
- `{{FLAZ_API_KEY}}` → Kunci API Flaz Cloud (dimulai dengan `sk-xxx`)
- `{{BUSINESS_NAME}}` → Nama bisnis UMKM Anda
- `{{SESSION_NAME}}` → Nama sesi WAHA Anda (biasanya `default`)
- `{{ADMIN_WHATSAPP_NUMBER}}` → (Khusus Handover) Nomor admin tanpa `+` atau `0`, misal: `628123456789`
- `{{WEBSITE_API_BASE_URL}}` → (Khusus Lead) URL website backend Anda (contoh: `https://chatbisnis.com`)
- `{{WEBSITE_INTERNAL_API_KEY}}` → (Khusus Lead) API key internal website Anda

*Tips Keamanan: Sebaiknya gunakan fitur "Credentials" di n8n untuk HTTP Request jika memungkinkan.*

---

## 🔗 Setup Webhook WAHA ke n8n

Setelah Anda menekan **Save** dan menyalakan *toggle* **Active** di n8n, Anda harus menghubungkan WAHA ke n8n Anda.

1. Buka kotak Node yang bernama **Webhook WAHA** di n8n (paling kiri).
2. Klik **Test URL** atau **Production URL**. Salin tautan (URL) tersebut.
3. Masukkan tautan tersebut ke konfigurasi `WHATSAPP_HOOK_URL` di VPS WAHA Anda (file `.env`).
4. Restart kontainer Docker WAHA Anda: `docker compose down && docker compose up -d`.

### Perbedaan Webhook Test vs Production
- **Test URL:** Digunakan saat menekan tombol "Listen for Event" di n8n untuk simulasi dan pengaturan *mapping* data awal. Jika tidak sedang ditekan, *event* akan ditolak/dibuang.
- **Production URL:** URL asli yang aktif 24/7 dan akan memicu eksekusi *workflow* otomatis di belakang layar.

---

## 🐞 Troubleshooting Dasar

- **Pesan masuk tapi AI tidak membalas?** Cek kotak "Filter Message" di n8n. Pastikan pesan bukan dari grup dan bukan dikirim oleh nomor Anda sendiri (`fromMe: true`).
- **Error saat mengirim balasan ke WAHA?** Pastikan URL di "Send WhatsApp Reply" menggunakan `http://` dan diakhiri `/api/sendText`. Pastikan juga *Session Name* sesuai.
- **Flaz AI Error?** Pastikan *Authorization Header* tertulis persis `Bearer ` diikuti spasi lalu API key Anda.

*Selamat Mengotomatisasi Bisnis Anda! 🚀*
