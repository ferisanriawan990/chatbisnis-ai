# Panduan Template n8n ChatBisnis AI

Folder ini berisi sekumpulan *workflow* (alur kerja) otomatis untuk n8n Cloud. Template ini dirancang khusus untuk memproses pesan WhatsApp yang masuk dari WhatsApp (WhatsApp HTTP API), membalasnya dengan Flaz Cloud AI, dan mengirimkan balasan kembali ke customer.

## Daftar Template

1. **`basic-ai-cs.json`**
   Template dasar untuk menjawab pesan WhatsApp secara otomatis menggunakan AI. Sangat direkomendasikan untuk pengguna baru. (Path webhook: `whatsapp-ai-cs-basic`)

2. **`ai-cs-product-knowledge.json`**
   Sama seperti basic, tetapi menyertakan fitur untuk memasukkan *product knowledge* (katalog produk/layanan) langsung ke dalam *prompt* AI. (Path webhook: `whatsapp-ai-cs-product`)

3. **`lead-capture.json`**
   Template pintar yang akan memerintahkan AI untuk mengekstrak Nama, Nomor, dan Minat customer, lalu mengirim data tersebut ke Webhook/Database Anda di `{{WEBSITE_API_BASE_URL}}/api/internal/chatbot/leads`. (Path webhook: `whatsapp-lead-capture`)

4. **`human-handover.json`**
   Mendeteksi jika customer sedang marah atau ingin berbicara dengan manusia (mengandung kata "admin", "cs", "komplain"). Bot akan berhenti, dan notifikasi akan dikirim ke WhatsApp pribadi Admin. (Path webhook: `whatsapp-human-handover`)

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

Template ini dibuat sangat aman. Tidak ada API Key asli atau IP pribadi yang tersimpan (*hardcode*). Kami menggunakan sistem *placeholder* ganda kurung kurawal, contoh: `{{FLAZ_API_KEY}}`. 

Di n8n, Anda wajib mengisi *placeholder* ini di setiap Node HTTP Request. Berikut daftar *placeholder* yang harus Anda ganti dengan nilai asli:

- `{{WHATSAPP_BASE_URL}}` → Alamat server WhatsApp Anda (contoh: `https://whatsapp.domainanda.com`)
- `{{WHATSAPP_API_KEY}}` → Kunci rahasia WhatsApp Anda
- `{{FLAZ_API_KEY}}` → Kunci API Flaz Cloud (dimulai dengan `sk-xxx`)
- `{{BUSINESS_NAME}}` → Nama bisnis UMKM Anda
- `{{SESSION_NAME}}` → Nama sesi WhatsApp spesifik user (contoh: `chatbisnis_user_abcd123`)
- `{{ADMIN_WHATSAPP_NUMBER}}` → (Khusus Handover) Nomor admin tanpa `+` atau `0`, misal: `628123456789`
- `{{WEBSITE_API_BASE_URL}}` → URL website backend Anda (default: `https://chatbisnis-ai.vercel.app`)
- `{{WEBSITE_INTERNAL_API_KEY}}` → API key internal website Anda untuk keamanan endpoint internal
- `{{WHATSAPP_WEBHOOK_SECRET}}` → Kunci rahasia untuk memvalidasi webhook WhatsApp (header `x-webhook-secret`)

*Tips Keamanan: Jangan pernah menyimpan API key di frontend. Untuk production, kelola API Key melalui Super Admin Panel ChatBisnis AI.*

---

## 🔗 Setup Webhook WhatsApp ke n8n

Setelah Anda menekan **Save** dan menyalakan *toggle* **Active** di n8n, Anda harus menghubungkan WhatsApp ke n8n Anda.

1. Buka kotak Node yang bernama **Webhook WhatsApp** di n8n (paling kiri).
2. Klik **Test URL** atau **Production URL**. Salin tautan (URL) tersebut.
3. Gunakan fitur Webhook di dashboard/API WhatsApp untuk mengarahkan notifikasi `message` ke tautan tersebut.
4. Pastikan untuk mengirimkan header `x-webhook-secret` bernilai sama dengan yang ada di `.env` backend website Anda.

### Perbedaan Webhook Test vs Production
- **Test URL:** Digunakan saat menekan tombol "Listen for Event" di n8n untuk simulasi dan pengaturan *mapping* data awal. Jika tidak sedang ditekan, *event* akan ditolak/dibuang.
- **Production URL:** URL asli yang aktif 24/7 dan akan memicu eksekusi *workflow* otomatis di belakang layar. Wajib menggunakan HTTPS untuk production.

---

## 🐞 Troubleshooting Dasar

- **Cara debug payload WhatsApp:** Gunakan webhook test n8n, atau cek log di Whatsapp Server Anda. Jangan mencetak (log) data payload sensitif secara berlebihan di production.
- **Pesan masuk tapi AI tidak membalas?** Cek kotak "Filter Message" di n8n. Pastikan pesan bukan dari grup dan bukan dikirim oleh nomor Anda sendiri (`fromMe: true`), serta pastikan pesan tidak kosong.
- **Error saat mengirim balasan ke WhatsApp?** Pastikan `{{WHATSAPP_BASE_URL}}` menggunakan HTTPS. Jangan me-loop request jika gagal mengirim balasan.
- **Flaz AI Error?** Pastikan *Authorization Header* tertulis persis `Bearer ` diikuti spasi lalu API key Anda. Jika Flaz gagal, bot diprogram untuk mengirim pesan fallback.

*Selamat Mengotomatisasi Bisnis Anda! 🚀*
