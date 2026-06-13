# Deployment Guide

Langkah-langkah deployment ke production.

1. Siapkan database PostgreSQL.
2. Siapkan Redis (Opsional, untuk antrian).
3. Atur Environment Variables di server/platform (Vercel, Railway, VPS).
4. Jalankan `npm install`.
5. Jalankan `npx prisma migrate deploy`.
6. Jalankan `npx prisma generate`.
7. Jalankan `npm run build`.
8. Start dengan `npm run start`.
