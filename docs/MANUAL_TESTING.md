# Panduan Testing Manual

Panduan ini berisi checklist untuk pengujian manual sistem.

## Autentikasi & Isolasi
- [ ] Login sebagai Super Admin.
- [ ] Buat Tenant baru.
- [ ] Login dengan User di Tenant A, pastikan data Tenant B tidak terlihat.

## Modul Chat AI
- [ ] Hubungkan sesi WhatsApp.
- [ ] Kirim pesan dari nomor customer.
- [ ] Pastikan webhook menangkap pesan masuk.
- [ ] Pastikan AI memberikan respons sesuai dengan knowledge base/produk.

## Human Handover
- [ ] Kirim pesan dengan sentimen marah atau kata kunci komplain.
- [ ] Pastikan status chat berubah menjadi "WAITING_ADMIN" (AI pause).
- [ ] Admin merespons, AI tidak ikut merespons.
- [ ] Kembalikan sesi ke AI.
