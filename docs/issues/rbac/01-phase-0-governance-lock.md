# [RBAC][Phase 0] Governance Lock: Source of Truth & Role Contract

> Status: **Implemented**
>
> Effective date: 2026-04-17
> Owner: Engineering

## Objective
Mengunci policy RBAC sebagai kontrak resmi tim agar tidak terjadi role drift antar layanan.

## Deliverables
- [x] Policy tertulis: Supabase untuk auth/session, Turso `users.role` untuk authorization.
- [x] Standar role enum final: `admin | manager | user`.
- [x] Policy sinkronisasi metadata (bootstrap-only) untuk user baru.
- [x] RACI/otoritas perubahan role produksi (admin-only).

## Governance Contract (Locked)

### 1) Source of Truth
- **Authentication & session**: Supabase Auth.
- **Authorization (effective role)**: Turso `users.role`.
- Metadata Supabase (`app_metadata.role` / `user_metadata.role`) hanya untuk **bootstrap provisioning** user baru.

### 2) Role Enum (Final)
Role valid aplikasi hanya:
- `admin`
- `manager`
- `user`

Setiap input role di luar enum di atas harus dinormalisasi/fallback ke role aman (`user`).

### 3) Metadata Synchronization Policy (Bootstrap-Only)
- User baru (belum ada row `users` di Turso):
  - Boleh baca metadata role Supabase untuk initial role saat provisioning.
- User existing (sudah ada row `users` di Turso):
  - **Dilarang overwrite role dari metadata Supabase**.
  - Effective role tetap mengikuti `users.role` di Turso.

### 4) Production Role Change Authority (Admin-Only)
- Perubahan role produksi hanya melalui jalur admin resmi (`/api/admin/users`).
- Endpoint non-admin/profil/sync user tidak boleh menerima input role untuk update role produksi.
- Setiap perubahan role wajib menyertakan reason dan audit log.

## RACI (Role Change Produksi)

| Aktivitas | Engineering | QA | Product Owner | Admin Operasional |
|---|---|---|---|---|
| Ajukan perubahan role user produksi | C | I | A | R |
| Review kebutuhan akses bisnis | C | I | A/R | C |
| Eksekusi perubahan role via admin flow | C | I | I | A/R |
| Verifikasi hasil akses pasca perubahan | C | A/R | I | R |
| Audit trail & evidencing | A/R | C | I | R |

Keterangan: **R** = Responsible, **A** = Accountable, **C** = Consulted, **I** = Informed.

## Approval Flow Perubahan Role Produksi
1. Request diajukan oleh Admin Operasional dengan alasan bisnis.
2. Product Owner memvalidasi kebutuhan akses (approve/reject).
3. Admin Operasional mengeksekusi perubahan lewat admin endpoint resmi.
4. Sistem mencatat audit log role change (`oldRole`, `newRole`, `actorId`, `reason`, `timestamp`).
5. QA/Admin verifikasi akses user pasca perubahan (UI + API smoke check).
6. Jika gagal/keliru, lakukan rollback role lewat jalur yang sama + audit log tambahan.

## Acceptance Criteria
- [x] Dokumen kebijakan disetujui tim.
- [x] Tidak ada istilah role lama (`viewer/editor`) di dokumen aktif.
- [x] Approval flow perubahan role produksi terdokumentasi.

## Dependencies
- Depends on: Umbrella issue
- Blocks: Phase 1, Phase 2, Phase 3
