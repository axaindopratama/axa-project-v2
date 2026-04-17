# RBAC Route-to-Permission Mapping

Dokumen ini menjadi referensi policy akses route berbasis permission agar UI, middleware, dan API tidak drift.

## Source of Policy
- `src/lib/rbac.ts`
  - `ROLE_PERMISSIONS`
  - `ROUTE_PERMISSIONS`
  - `canAccessRoute()`

## Mapping

| Route | Permission yang Dibutuhkan | Catatan |
|---|---|---|
| `/` | - | Dashboard, semua role |
| `/help` | - | Semua role |
| `/ai-chat` | - | Semua role |
| `/settings` | `settings:read` | Sesuai permission role |
| `/projects` | `projects:read` | termasuk sub-route |
| `/entities` | `entities:read` | termasuk sub-route |
| `/transactions` | `transactions:read` | termasuk sub-route |
| `/keuangan` | `transactions:read` | memakai domain transaksi |
| `/kanban` | `tasks:read` | berbasis permission tugas |
| `/scanner` | `tasks:read` | berbasis permission tugas |
| `/admin/audit` | `audit:read` | admin-only via permission |
| `/admin/users` | `users:read` | admin-only via permission |

## API Enforcement Notes (Phase 5)
- API tetap menjadi boundary final untuk authorization (di luar coarse route guard middleware).
- Endpoint observability RBAC (admin-only):
  - `GET /api/admin/rbac/metrics`
  - enforcement melalui validasi admin context di route handler (`users.role === 'admin'`).
- Structured decision logging aktif pada flow berikut:
  - middleware page-route decision (`route_guard_allowed` / `route_guard_denied`)
  - auth guard API (`api_auth_guard_authenticated` / deny reasons)
  - admin context guard (`admin_context_allowed` / forbidden / unauthorized)

## Incident Debug Quick Reference
- Jika akses route ditolak: cek `audit_logs` dengan `tableName='rbac'` dan `recordId=<path>`.
- Field minimum untuk diagnosis cepat:
  - `effectiveRole`
  - `roleSource`
  - `decision`
  - `reason`
- Untuk tren agregat gunakan endpoint:
  - `GET /api/admin/rbac/metrics`

## Konsistensi Implementasi
- **Sidebar** (`src/components/layout/Sidebar.tsx`) menampilkan menu berdasarkan `requiredPermission` + `hasPermission()`.
- **Middleware** (`src/middleware.ts`) menggunakan `canAccessRoute()` sebagai coarse route guard.
- **API** tetap menjadi boundary final dan memverifikasi permission di endpoint masing-masing.

## Rule Update
Setiap penambahan route protected wajib:
1. Menambah mapping di `ROUTE_PERMISSIONS`.
2. Menentukan permission yang konsisten dengan `ROLE_PERMISSIONS`.
3. Menyesuaikan sidebar (jika route muncul sebagai menu).
4. Menambahkan/menyesuaikan test matrix RBAC (Phase 4).
