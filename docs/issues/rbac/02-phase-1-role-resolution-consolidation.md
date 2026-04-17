# [RBAC][Phase 1] Role Resolution Consolidation

> Status: **Implemented**
>
> Effective date: 2026-04-17
> Owner: Engineering

## Objective
Menjamin semua pembacaan role metadata berjalan lewat helper terpusat, dan effective role aplikasi selalu authoritative dari Turso.

## Deliverables
- [x] Audit seluruh codebase: tidak ada direct read `user.user_metadata.role` di luar helper.
- [x] Konsolidasi helper role pada `rbac.ts`, `userProvisioning.ts`, `auth.ts`, `middleware.ts`.
- [x] Tambah guard/check (grep/lint pattern) untuk mencegah reintroduksi.

## Implementation Notes
- Central helper pembacaan metadata role berada di `src/lib/rbac.ts`:
  - `getSupabaseRoleValue()`
  - `resolveSupabaseUserRole()`
- Effective role flow lintas layer menggunakan Turso via `getOrProvisionAppUser()`:
  - `src/lib/auth.ts`
  - `src/middleware.ts`
  - `src/app/(protected)/layout.tsx`
- Guard pencegahan regresi ditambahkan sebagai script:
  - `package.json` → `rbac:guard:metadata-role`
  - Rule: fail bila ada `user_metadata.role` / `app_metadata.role` di luar `src/lib/rbac.ts`.

## Acceptance Criteria
- [x] Pencarian pattern direct metadata-role read = 0 (kecuali helper).
- [x] Effective role flow konsisten lintas middleware/UI/API.
- [x] Tidak ada regresi login/provisioning flow.

## Dependencies
- Depends on: Phase 0
- Blocks: Phase 2, Phase 3
