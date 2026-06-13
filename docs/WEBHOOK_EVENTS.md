# Webhook Events

Dokumentasi untuk event webhook baik yang masuk (inbound) dari gateway WhatsApp maupun yang keluar (outbound) ke sistem eksternal pengguna.

## Inbound (Dari WhatsApp ke Sistem)
- `message.any`: Menerima semua pesan masuk.
- `session.status`: Menerima update status sesi WhatsApp (Connected, Disconnected).

## Outbound (Dari Sistem ke Integrasi Eksternal)
- `lead.created`: Saat ada lead baru tertangkap.
- `order.created`: Saat pesanan baru terbuat.
- `payment.success`: Saat pembayaran divalidasi.
