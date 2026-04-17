# [RBAC][Phase 2] Permission-Driven Navigation & Route Policy

> Status: **Implemented**
>
> Effective date: 2026-04-17
> Owner: Engineering

## Objective
Menyelaraskan akses UI, route guard, dan API dengan permission policy yang sama agar tidak drift.

## Deliverables
- [x] Refactor sidebar ke model `requiredPermission`.
- [x] Visibility menu berdasarkan `hasPermission(effectiveRole, requiredPermission)`.
- [x] Sinkronisasi `canAccessRoute()` dengan permission map.
- [x] Dokumentasi route-to-permission mapping.

## Implementation Notes
- Sidebar menggunakan `requiredPermission` pada tiap menu dan filtering via:
  - `hasPermission(effectiveRole, requiredPermission)`
  - File: `src/components/layout/Sidebar.tsx`
- Route guard middleware menggunakan policy terpusat di `ROUTE_PERMISSIONS`:
  - File policy: `src/lib/rbac.ts`
  - Enforcement: `canAccessRoute()` dipakai di `src/middleware.ts`
- Permission map utama tetap terpusat pada `ROLE_PERMISSIONS` (`src/lib/rbac.ts`).
- Dokumentasi mapping route ↔ permission: `docs/issues/rbac/route-to-permission-mapping.md`

## Acceptance Criteria
- [x] Tidak ada hardcoded role-list yang tersebar untuk menu utama.
- [x] Admin melihat menu lengkap termasuk Kanban/Keuangan/AI Scanner/Audit Log.
- [x] Manager/User hanya melihat menu sesuai permission.

## Dependencies
- Depends on: Phase 1
- Blocks: Phase 4
