# Arsitektur Sistem ChatBisnis AI

## Ringkasan
ChatBisnis AI adalah platform multi-tenant berbasis Next.js 15 (App Router), Prisma (PostgreSQL), dan Node.js yang berfungsi sebagai engine chatbot WhatsApp untuk bisnis.

## Komponen Utama
1. **Frontend**: Next.js App Router dengan React Server Components (RSC) dan Tailwind CSS.
2. **Backend / API**: Next.js Route Handlers.
3. **Database**: PostgreSQL (dikelola melalui Prisma ORM).
4. **WhatsApp Gateway**: Integrasi dengan WAHA (WhatsApp HTTP API) atau Baileys.
5. **AI Engine**: LLM Provider (Flaz Cloud / Claude / OpenAI) untuk membalas pesan.
6. **Task Queue & Background Jobs**: (Segera diimplementasikan menggunakan Redis / BullMQ atau Vercel Cron/Inngest).

## Desain Multi-Tenant
Setiap pengguna/pemilik bisnis akan memiliki entitas `Tenant`. Satu `Tenant` dapat memiliki banyak `Branch` (Cabang), nomor WhatsApp (`WhatsAppSession`), dan `User` dengan Role yang berbeda.

*Isolasi Data*: Semua kueri ke database HARUS menggunakan `tenantId` untuk mencegah kebocoran data antar tenant.

## Authentication & Authorization
- **Auth**: NextAuth.js (Session berbasis JWT/Database).
- **Authorization**: RBAC (Role-Based Access Control) berbasis tabel `Role` dan `Permission`.

## Struktur Direktori
- `/src/app`: Frontend dan API routes.
- `/src/lib`: Helper, engine, service terpusat.
- `/src/components`: Reusable UI components.
- `/prisma`: Skema database dan migrasi.
- `/docs`: Dokumentasi proyek.
