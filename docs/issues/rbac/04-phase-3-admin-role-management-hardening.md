# [RBAC][Phase 3] Admin Role Management Hardening

> Status: **Implemented**
>
> Effective date: 2026-04-17
> Owner: Engineering

## Objective
Memastikan perubahan role hanya terjadi lewat jalur resmi, tervalidasi, dan ter-audit.

## Deliverables
- [x] Hardening endpoint admin role update (`/api/admin/users`).
- [x] Validasi ketat: actor admin, enum role valid, payload strict.
- [x] Audit log wajib untuk setiap role change (`oldRole`, `newRole`, `actorId`, `reason`, `timestamp`).
- [x] (Opsional) Proteksi self-demotion admin terakhir.

## Implementation Notes
- Endpoint resmi role management: `src/app/api/admin/users/route.ts`.
- Hardening yang diterapkan:
  - Actor authorization: wajib admin dari Turso (`users.role`).
  - Payload strict validation via `zod` (`.strict()`) untuk mencegah field liar.
  - Enum role dibatasi ke `admin | manager | user`.
  - Role change wajib `reason` non-empty.
  - Audit log `ROLE_CHANGE` menyimpan `oldRole`, `newRole`, `actorId`, `reason`, `timestamp`.
  - Proteksi self-demotion admin terakhir (request ditolak jika admin tersisa 1).
- Endpoint lain tidak menulis role secara bebas; hanya inisialisasi aman `role: user` pada create/provisioning flow.

## Acceptance Criteria
- [x] Tidak ada endpoint lain yang bisa menulis `users.role`.
- [x] Semua role update muncul di audit log.
- [x] Role change gagal dengan status/response benar jika tidak authorized.

## Dependencies
- Depends on: Phase 1
- Blocks: Phase 4, Phase 5
