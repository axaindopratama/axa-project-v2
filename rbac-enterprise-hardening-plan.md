# RBAC Enterprise Hardening Plan (AXA Project)

## 1) Tujuan Dokumen

Dokumen ini menjadi blueprint final untuk menstandarkan flow Auth + RBAC agar:

1. Role `admin` selalu terdeteksi benar dan dapat akses penuh.
2. Tidak ada mismatch role antara Supabase dan database aplikasi.
3. Alur otorisasi konsisten di UI, middleware, dan API.
4. Perubahan role aman, ter-audit, dan tidak rawan regresi.

---

## 2) Prinsip Standar (Non-Negotiable)

### 2.1 Single Source of Truth untuk Role
- **Sumber utama role:** `users.role` di database aplikasi (Turso).
- `app_metadata` / `user_metadata` Supabase hanya untuk bootstrap/fallback awal provisioning.
- Setelah user ada di Turso, role aktif aplikasi dibaca dari Turso.

### 2.2 Separation of Responsibilities
- **Supabase Auth:** identitas + session + login.
- **Turso users table:** role + profil aplikasi + company context.
- **Permission engine (`ROLE_PERMISSIONS`)**: policy terpusat.

### 2.3 Defense in Depth
- Sidebar = kenyamanan UX (bukan security boundary utama).
- Middleware = coarse route guard.
- API route = final enforcement (wajib).

### 2.4 Role Change Governance
- Perubahan role hanya lewat endpoint admin resmi.
- Setiap perubahan role wajib audit log (`who`, `when`, `old`, `new`, `reason`).

---

## 3) State Arsitektur Target

## Auth & RBAC Runtime Flow

1. User login via Supabase Auth.
2. Middleware memanggil provisioning/sync context user ke Turso (idempotent).
3. Aplikasi membaca `users.role` sebagai effective role.
4. UI menampilkan menu berdasarkan permission dari effective role.
5. API memvalidasi permission pada setiap endpoint protected.

## Priority Rule saat provisioning

Saat user belum ada di Turso:
- Coba ambil role dari `app_metadata.role`.
- Jika tidak ada, fallback ke `user_metadata.role`.
- Jika tidak valid, default `user`.

Saat user sudah ada di Turso:
- Role Turso dianggap authoritative.
- Sinkronisasi dari metadata dilakukan **hanya jika explicit policy mengizinkan** (lihat fase rollout).

---

## 4) Gap yang Perlu Dihardening (Agar Tidak Terulang)

1. **Policy sinkronisasi role belum terdokumentasi formal**
   - Risiko: role overwrite tak terduga antar lingkungan.

2. **Sebagian akses route masih role-list based**
   - Risiko: drift antara route guard dan permission map.

3. **Belum ada test matrix RBAC end-to-end**
   - Risiko: bug regresi saat refactor/penambahan fitur.

4. **Belum ada SOP operasional perubahan role**
   - Risiko: perubahan manual langsung DB tanpa audit.

5. **Belum ada observability khusus RBAC**
   - Risiko: sulit investigasi mismatch role di produksi.

---

## 5) Rencana Implementasi Enterprise-Grade (Phased)

## Phase 0 — Policy Freeze & Governance (Wajib Dulu)

Output:
- Dokumen policy internal RBAC disetujui tim.
- Keputusan final: Turso sebagai source of truth role.
- Definisi role resmi: `admin`, `manager`, `user`.

Checklist:
- [ ] Publish policy “role authority & synchronization”.
- [ ] Tetapkan siapa yang berhak mengubah role (admin tertentu).
- [ ] Tetapkan approval process perubahan role produksi.

---

## Phase 1 — Code Consolidation (Core)

Target:
- Semua pembacaan role dari Supabase metadata lewat helper terpusat.
- Middleware, auth helper, provisioning konsisten memakai helper sama.

Implementasi:
- Pertahankan helper terpusat:
  - `getSupabaseRoleValue()`
  - `resolveSupabaseUserRole()`
- Larang pembacaan langsung `user.user_metadata.role` di codebase (lint/pattern check).

Checklist:
- [ ] No direct metadata role read di seluruh repo.
- [ ] Seluruh fallback role lewat helper terpusat.

---

## Phase 2 — Permission-Driven Access (UI + Route)

Target:
- Sidebar dan guard memakai permission model yang sama.

Implementasi:
- Definisikan konfigurasi menu berbasis permission (contoh: `requiredPermission: "audit:read"`).
- Derive visibility menu dari `hasPermission(effectiveRole, requiredPermission)`.
- Audit `canAccessRoute()` agar sinkron dengan policy permission.

Checklist:
- [ ] Tidak ada hardcoded role check tersebar untuk menu.
- [ ] Mapping route ↔ permission terdokumentasi.

---

## Phase 3 — Admin Role Management Hardening

Target:
- Perubahan role terkontrol dan ter-audit 100%.

Implementasi:
- Endpoint admin update role:
  - validasi enum role ketat,
  - validasi actor adalah admin,
  - menolak self-demotion kritikal (opsional policy),
  - tulis audit log lengkap.
- Tambah reason field (opsional, direkomendasikan).

Checklist:
- [ ] Semua role update tercatat audit.
- [ ] Tidak ada jalur lain update role selain endpoint admin resmi.

---

## Phase 4 — Testing & Quality Gates

Target:
- RBAC regressions dicegah sebelum merge/deploy.

Test matrix minimum:

1. **Admin**
   - Sidebar menampilkan: Dashboard, Proyek, Entitas, Transaksi, Keuangan, Kanban, AI Scanner, AI Pilot, Pengaturan, Audit Log.
   - API admin dapat diakses.

2. **Manager**
   - Bisa akses operasional (proyek/transaksi/kanban/scanner/keuangan).
   - Tidak bisa akses endpoint admin users/audit khusus admin.

3. **User**
   - Akses terbatas sesuai permission map.
   - Ditolak pada route/endpoint privileged.

4. **Role source scenarios**
   - `app_metadata.role = admin`, Turso belum ada -> hasil admin saat provisioning awal.
   - Turso sudah admin, metadata kosong -> tetap admin.
   - Turso manager, metadata admin -> behavior mengikuti policy sinkronisasi yang ditetapkan.

Quality gate CI:
- [ ] Lint pass.
- [ ] Unit test RBAC pass.
- [ ] Integration test critical route/API pass.

---

## Phase 5 — Observability, Runbook, Rollout

Target:
- Mudah didiagnosis saat issue di produksi.

Implementasi:
- Tambah structured log field: `effectiveRole`, `roleSource`, `path`, `decision`, `reason`.
- Tambah dashboard metrik:
  - total access denied per role,
  - role change events,
  - provisioning failure count.
- Siapkan rollback plan bila policy baru menyebabkan akses tidak sesuai.

Checklist:
- [ ] Ada runbook incident RBAC.
- [ ] Ada SOP verifikasi pasca deploy.

---

## 6) SOP Operasional Harian

## A. Menambah user baru
1. Buat user di Supabase Auth.
2. Login pertama memicu provisioning ke Turso.
3. Jika butuh elevated role, admin update via halaman admin users.
4. Verifikasi audit log role change.

## B. Mengubah role user
1. Admin login.
2. Ubah role via endpoint/UI admin resmi.
3. Isi alasan perubahan.
4. Verifikasi berhasil + audit log tercatat.

## C. Debug jika menu admin tidak muncul
1. Cek `users.role` di Turso.
2. Cek hasil effective role pada request (header/log).
3. Cek `hasPermission` untuk menu terkait.
4. Cek route/API denial log.

---

## 7) Standar Kode yang Harus Dipatuhi

1. Dilarang baca role metadata secara langsung di luar helper.
2. Dilarang check role string ad-hoc di banyak file UI/API.
3. Semua akses API protected wajib via `getAuthenticatedUser()` + permission check.
4. Semua policy role/permission ada di satu modul pusat.
5. Setiap perubahan RBAC wajib update test + dokumentasi.

---

## 8) Prioritas Eksekusi (Praktis untuk Tim)

Prioritas 1 (minggu ini):
- Finalisasi policy source-of-truth dan sinkronisasi.
- Rapikan seluruh callsite ke helper role terpusat.
- Pastikan admin sidebar + admin API konsisten.

Prioritas 2 (minggu depan):
- Refactor sidebar ke permission-driven config.
- Tambah test matrix RBAC inti.

Prioritas 3 (berkelanjutan):
- Observability + runbook incident.
- CI quality gate untuk RBAC changes.

---

## 9) Acceptance Criteria (Definition of Done)

Fitur dianggap selesai jika:

1. Role admin konsisten terdeteksi di seluruh layer (UI/middleware/API).
2. Menu admin selalu muncul untuk admin valid.
3. Endpoint admin hanya bisa diakses admin.
4. Tidak ada direct metadata role read di codebase (kecuali helper terpusat).
5. Perubahan role ter-audit dan dapat ditelusuri.
6. Test RBAC utama berjalan di CI.

---

## 10) Catatan Implementasi untuk Kondisi Saat Ini

Berdasarkan perubahan yang sudah berjalan, fondasi penting sudah ada (helper role terpusat + konsolidasi flow). Langkah berikutnya adalah meningkatkan governance, testing, dan observability agar benar-benar enterprise-grade dan tahan regresi jangka panjang.
