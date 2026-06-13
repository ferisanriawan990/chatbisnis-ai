# Security Checklist

- [ ] Tidak ada API keys atau secret hardcoded di kode sumber.
- [ ] Penggunaan `.env` wajib, file `.env` masuk `.gitignore`.
- [ ] Credential WhatsApp (jika ada token session) dienkripsi dalam database.
- [ ] Webhook memiliki validasi signature/token rahasia.
- [ ] Seluruh endpoint internal divalidasi oleh otorisasi Tenant.
- [ ] Implementasi rate limiter untuk mencegah brute-force atau spam WA.
- [ ] SQL Injection aman (Prisma ORM sudah terproteksi, tapi hindari raw SQL dinamis).
- [ ] Sanitasi Input dari customer sebelum dilempar ke AI untuk mencegah *Prompt Injection*.
