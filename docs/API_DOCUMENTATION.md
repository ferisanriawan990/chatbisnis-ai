# API Documentation

*(Akan dilengkapi seiring pengembangan)*

Semua API internal berada di `/api/dashboard/*` atau `/api/internal/*`.
Pastikan semua endpoint terlindungi dengan:
1. Pengecekan autentikasi (NextAuth session).
2. Pengecekan otorisasi (RBAC / Tenant check).
3. Pengecekan Feature Flag (jika fitur tersebut berbayar).
