# [RBAC][Phase 4] Test Matrix & Quality Gates

> Status: **Implemented**
>
> Effective date: 2026-04-17
> Owner: Engineering

## Objective
Mencegah regresi RBAC dengan test matrix lintas role dan quality gate di CI.

## Deliverables
- [x] Test skenario admin/manager/user untuk UI visibility + API authorization.
- [x] Test skenario source role (app_metadata/user_metadata/Turso existing).
- [x] Integrasi test minimal untuk endpoint kritikal admin dan route protected.
- [x] CI gate: lint + unit/integration test RBAC.

## Implementation Notes
- Test matrix RBAC menggunakan panduan terstruktur di:
  - `rbac-auth-master-plan-testing.md`
  - mencakup skenario role admin/manager/user, source role metadata vs Turso existing, serta API authorization.
- Regression guard bug awal (admin menu hilang) ditutup lewat script quality gate:
  - `scripts/rbac-quality-gate.mjs`
  - memverifikasi menu/admin routes kritikal tetap permission-driven.
- Quality gate scripts:
  - `npm run lint`
  - `npm run rbac:guard:metadata-role`
  - `npm run rbac:quality-gate`
  - agregat: `npm run rbac:ci`
- CI workflow ditambahkan:
  - `.github/workflows/rbac-quality-gate.yml`
  - menjalankan `npm ci` + `npm run rbac:ci` pada push/PR.

## Acceptance Criteria
- [x] Seluruh test RBAC utama lulus di CI.
- [x] Bug admin menu hilang memiliki regression test.
- [x] Build ditahan jika RBAC tests gagal.

## Dependencies
- Depends on: Phase 2, Phase 3
- Blocks: Phase 5
