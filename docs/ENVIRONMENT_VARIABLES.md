# Environment Variables

Daftar environment variable yang dibutuhkan oleh ChatBisnis AI.

## Wajib
- `DATABASE_URL`: Connection string PostgreSQL.
- `NEXTAUTH_SECRET`: Secret key untuk session NextAuth.
- `NEXTAUTH_URL`: Base URL aplikasi.
- `ENCRYPTION_KEY`: Kunci enkripsi 32-byte untuk mengamankan data sensitif seperti API Key dan WhatsApp Session Credential.

## AI Provider
- `FLAZ_API_KEY`: API Key Flaz Cloud.
- `FLAZ_BASE_URL`: Base URL endpoint Flaz Cloud.
- `FLAZ_CHAT_MODEL`: Model AI default untuk chat (misal: claude-3-haiku).

## WhatsApp Gateway
- `WHATSAPP_URL`: URL WhatsApp Server (jika menggunakan engine terpisah).
- `WHATSAPP_API_KEY`: API Key WhatsApp Server.

## Opsional (Untuk Fitur Lanjut)
- `REDIS_URL`: Untuk task queue / rate limiting.
- `STORAGE_PROVIDER`: Penyimpanan file (S3, R2, dll).
- `WEBHOOK_SECRET`: Secret untuk verifikasi webhook masuk.
