# Master Plan: Auth & RBAC Hardening (AXA Project)

> Status: **Final unified plan** (menggabungkan `implementation-plan-auth-rbac.md` + `rbac-enterprise-hardening-plan.md`)
> 
> Scope: stabilisasi bug admin menu tidak muncul, standardisasi flow role, dan hardening enterprise-grade.

---

## 1) Executive Summary

Masalah utama berasal dari **inkonsistensi sumber role** (kadang metadata Supabase, kadang DB aplikasi). Solusi final adalah memisahkan concern secara tegas:

- **Authentication / session**: Supabase Auth
- **Authorization / effective role**: Turso `users.role` (authoritative)
- **Policy enforcement**: helper RBAC terpusat + API-level permission checks

Dengan model ini, role `admin` menjadi konsisten di sidebar, middleware, dan endpoint API.

---

## 2) Standard Architecture Contract (Wajib)

## 2.1 Source of Truth
- User identity: Supabase (`auth.users`)
- Effective role aplikasi: Turso (`users.role`)
- Metadata Supabase (`app_metadata.role` / `user_metadata.role`) hanya untuk bootstrap awal provisioning.

## 2.2 Role Enum Tunggal
- `admin`
- `manager`
- `user`

Tidak boleh ada role lain (`viewer/editor`) di logic aktif aplikasi.

## 2.3 Security Layers
1. **UI (Sidebar):** hanya untuk visibility UX.
2. **Middleware:** coarse route guard.
3. **API route:** final security boundary (mandatory).

---

## 3) Current State & Gap

## Sudah ada
- Helper normalisasi/resolve role.
- Provisioning user ke Turso.
- Middleware route guard.
- RBAC permission map dasar.

## Gap tersisa
1. Belum ada dokumen master tunggal yang mengunci policy.
2. Potensi drift antara route-guard dan permission map.
3. Sidebar masih riskan hardcoded role list.
4. Belum ada quality gate test RBAC end-to-end.
5. SOP operasional role change + incident runbook belum formal.

---

## 4) Final Implementation Roadmap (Prescriptive)

## Phase 0 — Governance Lock (Day 1)

**Output:** keputusan policy tertulis dan disetujui.

Checklist:
- [ ] Tetapkan Turso `users.role` sebagai role authority.
- [ ] Tetapkan policy sinkronisasi role dari metadata (bootstrap-only).
- [ ] Tetapkan actor yang berhak ubah role (admin only).
- [ ] Tetapkan approval flow untuk perubahan role produksi.

---

## Phase 1 — Role Resolution Consolidation (Day 1-2)

**Tujuan:** tidak ada lagi pembacaan role metadata ad-hoc.

Implementation rules:
- Semua parsing role metadata via helper terpusat (`resolveSupabaseUserRole`).
- Effective role untuk app behavior selalu dari Turso via `getOrProvisionAppUser`.
- Larang direct read `user.user_metadata.role` di luar helper (dengan grep/lint guard).

Target files:
- `src/lib/rbac.ts`
- `src/lib/userProvisioning.ts`
- `src/lib/auth.ts`
- `src/middleware.ts`

---

## Phase 2 — Permission-Driven Navigation & Route Policy (Day 2-3)

**Tujuan:** satu policy untuk UI + route + API.

Implementation:
- Refactor `src/components/layout/Sidebar.tsx` agar tiap menu punya `requiredPermission`.
- Visibility menu: `hasPermission(effectiveRole, requiredPermission)`.
- Sinkronkan `canAccessRoute()` dengan policy permission terpusat.
- Dokumentasikan route-to-permission map.

Contoh mapping minimum:
- `/admin/audit` -> `audit:read`
- `/scanner` -> `tasks:read` atau permission khusus scanner (jika dipisah)
- `/keuangan` -> `transactions:read`

---

## Phase 3 — Admin Role Management Hardening (Day 3-4)

**Tujuan:** perubahan role aman, terbatas, dan ter-audit.

Implementation:
- Endpoint admin role update (`src/app/api/admin/users/route.ts`):
  - validasi actor role = admin,
  - validasi enum role ketat,
  - audit log wajib (`oldRole`, `newRole`, `actor`, `reason`),
  - optional: block self-demotion untuk mencegah lockout admin terakhir.

Operational guardrail:
- Tidak boleh ada endpoint/user flow lain yang bisa menulis `users.role`.

---

## Phase 4 — Test Matrix & Quality Gates (Day 4-6)

**Tujuan:** cegah regresi sebelum merge/deploy.

## 4.1 Test Matrix

### Admin
- [ ] Sidebar menampilkan: Kanban, Keuangan, AI Scanner, Audit Log.
- [ ] Bisa akses endpoint admin (`/api/admin/users`, audit endpoint).

### Manager
- [ ] Bisa akses route operasional (projects/entities/transactions/kanban/scanner/keuangan).
- [ ] Ditolak pada route admin-only.

### User
- [ ] Hanya bisa akses fitur sesuai permission map.
- [ ] Ditolak endpoint privileged.

### Role source scenarios
- [ ] New user + `app_metadata.role=admin` -> provisioning awal menjadi admin (sesuai policy bootstrap).
- [ ] Existing Turso admin + metadata kosong -> tetap admin.
- [ ] Existing Turso manager + metadata admin -> ikuti policy sinkronisasi yang disetujui (default: Turso authoritative).

## 4.2 CI Gate
- [ ] `npm run lint` pass
- [ ] unit test RBAC pass
- [ ] integration test route/API critical pass

---

## Phase 5 — Observability, Runbook, Rollout (Day 6-7)

**Tujuan:** mudah investigasi issue produksi.

Implementation:
- Structured log fields: `effectiveRole`, `roleSource`, `path`, `decision`, `reason`.
- Metrik utama:
  - access denied by role,
  - role-change events,
  - provisioning failures.
- Runbook troubleshooting: “admin menu tidak muncul”.
- Rollback plan jika policy update berdampak luas.

---

## 5) SOP Operasional (Ringkas)

## A) User baru
1. Create user di Supabase.
2. Login pertama -> provisioning ke Turso.
3. Jika perlu elevate role -> admin update via admin users page/API.
4. Verifikasi audit log.

## B) Ubah role
1. Admin submit role change + reason.
2. Sistem validasi + update + audit log.
3. Verifikasi akses menu/API sesuai role baru.

## C) Debug cepat admin menu hilang
1. Cek `users.role` di Turso.
2. Cek effective role pada request log/header.
3. Cek permission map untuk menu target.
4. Cek deny audit/log di middleware/API.

---

## 6) Definition of Done (Wajib Terpenuhi)

Plan dianggap selesai jika:
- [ ] Role admin konsisten terdeteksi di UI, middleware, API.
- [ ] Menu admin (Kanban, Keuangan, AI Scanner, Audit Log) muncul untuk admin valid.
- [ ] Endpoint admin hanya bisa diakses admin.
- [ ] Tidak ada direct metadata-role read di luar helper terpusat.
- [ ] Semua role change tercatat audit.
- [ ] Test RBAC utama masuk CI dan lulus.

---

## 7) Recommended Execution Order

1. Phase 0 (policy lock)
2. Phase 1 (code consolidation)
3. Phase 2 (permission-driven UI/route)
4. Phase 3 (admin role hardening)
5. Phase 4 (tests + CI gate)
6. Phase 5 (observability + runbook)

Urutan ini meminimalkan risiko production regression sambil menjaga delivery bertahap.
