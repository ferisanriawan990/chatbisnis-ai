# Perubahan Database (Database Changes)

File ini melacak perubahan signifikan pada database untuk mendukung 162 fitur.

## FASE 1: Fondasi Multi-Tenant dan RBAC
- **Tenant**: Model baru yang menjadi root untuk semua entitas bisnis.
- **Branch**: Model baru untuk mengelola multi-cabang dalam satu tenant.
- **Role, Permission, RolePermission**: Sistem RBAC yang dinamis.
- **FeatureDefinition & TenantFeatureSetting**: Mengontrol fitur apa saja yang aktif pada setiap Tenant sesuai paket berlangganan.

*(Selalu gunakan `npx prisma migrate dev --name <nama_migrasi>` untuk setiap perubahan).*
