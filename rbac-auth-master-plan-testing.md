# RBAC Auth Master Plan — Testing Guide

Dokumen ini adalah panduan testing end-to-end untuk memvalidasi flow Auth + RBAC setelah hardening.

Fokus utama:
1. Validasi pembuatan user baru di Supabase Auth.
2. Validasi provisioning user ke database aplikasi (Turso).
3. Validasi login aplikasi.
4. Validasi role-based access (admin, manager, user).
5. Validasi security boundary (UI, middleware, API).
6. Validasi observability/audit trail.

---

## 1) Prasyarat Testing

## Environment
- Aplikasi berjalan (`npm run dev` atau environment staging).
- Variabel environment Supabase sudah benar:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (jika dipakai endpoint tertentu)
- Koneksi database aplikasi (Turso/libSQL) aktif.

## Data Awal yang Dibutuhkan
- Minimal 1 user existing `admin` untuk mengelola role.
- Role enum aktif di aplikasi: `admin`, `manager`, `user`.

## Rule yang Dites
- Authentication: Supabase Auth.
- Authorization (effective role): `users.role` di Turso.
- Metadata Supabase (`app_metadata`/`user_metadata`) hanya bootstrap/fallback provisioning awal.

## Pre-Test Quality Gate (Wajib Sebelum Eksekusi Skenario)

> Tujuan: memastikan baseline code + policy RBAC sudah valid sebelum test manual/UAT dimulai.

Jalankan perintah berikut dari root project:

```bash
npm run lint
```

```bash
npm run rbac:guard:metadata-role
```

```bash
npm run rbac:quality-gate
```

Atau gunakan satu perintah agregat:

```bash
npm run rbac:ci
```

**Gate lulus jika:**
- Semua command exit code `0`.
- Tidak ada error lint.
- Tidak ada pelanggaran guard metadata-role.
- Regression guard RBAC tidak menemukan drift policy.

---

## 2) Checklist Smoke Test (Cepat)

- [ ] Pre-test quality gate lulus (`npm run rbac:ci`).
- [ ] User bisa dibuat di Supabase Auth.
- [ ] User baru bisa login aplikasi.
- [ ] Row user ter-provision ke Turso.
- [ ] Role efektif terbaca benar.
- [ ] Menu sidebar sesuai role.
- [ ] API admin ditolak untuk non-admin.
- [ ] Audit/deny log tercatat.

---

## 3) Test Scenario Detail

## Panduan Detail — Membuat User Baru dengan `app_metadata.role` (Step-by-Step)

Bagian ini adalah prosedur paling penting untuk test role admin/manager dari Supabase Auth.

## Metode 1 (Direkomendasikan): Buat user lewat Supabase Dashboard

### Langkah 1 — Buka menu Auth Users
1. Login ke Supabase Dashboard project yang dipakai aplikasi.
2. Masuk ke menu **Authentication**.
3. Pilih tab **Users**.

### Langkah 2 — Create user baru
1. Klik tombol **Add user** / **Create user**.
2. Isi email test (contoh: `test-admin-01@yourdomain.com`).
3. Isi password sementara.
4. Pastikan user bisa login (email confirmed jika diperlukan setting project).

### Langkah 3 — Set `app_metadata.role`
1. Buka detail user yang baru dibuat.
2. Cari field **App Metadata**.
3. Isi JSON metadata, contoh untuk admin:

```json
{
  "role": "admin"
}
```

Contoh untuk manager:

```json
{
  "role": "manager"
}
```
# Tambah user dengan Role = admin (admin@axa.com)
update auth.users
set raw_app_meta_data = jsonb_set(
  coalesce(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'::jsonb,
  true
)
where email = 'admin@axa.com';

select
  id,
  email,
  raw_app_meta_data,
  raw_user_meta_data
from auth.users
where email = 'admin@axa.com';

# Rollback (cara hapus role)
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) - 'role'
where id = 'cd6088a8-2dd1-4aeb-b35e-411ca0d6e13e';


4. Simpan perubahan.

> Penting:
> - Gunakan key tepat: `role`
> - Nilai valid hanya: `admin`, `manager`, `user`
> - Huruf kecil semua (lowercase) untuk konsistensi.

### Langkah 4 — Verifikasi metadata tersimpan
1. Refresh halaman detail user.
2. Pastikan `app_metadata.role` tetap ada sesuai nilai yang diisi.

### Langkah 5 — Login ke aplikasi
1. Buka aplikasi (`/login`).
2. Login dengan email/password user baru.
3. Tunggu provisioning user ke Turso saat login pertama.

### Langkah 6 — Verifikasi hasil provisioning
1. Cek tabel `users` di Turso untuk user tersebut.
2. Pastikan:
   - `supabaseUserId` match user Supabase.
   - `role` terisi sesuai `app_metadata.role` pada login pertama (sesuai policy bootstrap).

### Langkah 7 — Verifikasi UI + route + API
1. Cek sidebar sesuai role.
2. Coba akses halaman yang relevan.
3. Coba endpoint admin untuk memastikan authorization benar.

---

## Metode 2 (Opsional): Set `app_metadata.role` via SQL/Function/Server-side Script

Gunakan metode ini jika tim mengelola user secara terotomasi. Jangan expose service-role key ke client browser.

Contoh payload metadata yang harus dihasilkan:

```json
{
  "role": "admin"
}
```

Validasi akhir tetap sama:
- user login berhasil,
- provisioning ke Turso benar,
- role efektif sesuai ekspektasi,
- akses sesuai policy.

---

## Skenario A — Buat User Baru di Supabase Auth

### A1. Create user tanpa role metadata
**Langkah:**
1. Buat user baru dari Supabase Auth dashboard (email/password).
2. Pastikan tidak set `app_metadata.role` / `user_metadata.role`.
3. Login ke aplikasi dengan user tersebut.

**Ekspektasi:**
- Login berhasil.
- User otomatis terbuat di Turso (`users.supabaseUserId` match).
- `users.role` default menjadi `user`.
- Sidebar menampilkan menu sesuai role user terbatas.

### A2. Create user dengan `app_metadata.role=admin`
**Langkah:**
1. Ikuti panduan detail di atas (Metode 1), isi `app_metadata`:

```json
{
  "role": "admin"
}
```

2. Login pertama ke aplikasi.
3. Verifikasi row Turso user dan role hasil provisioning.
4. Verifikasi akses admin (sidebar, route, API).

**Ekspektasi:**
- Provisioning awal membaca metadata role.
- `users.role` menjadi `admin` (sesuai policy bootstrap).
- Sidebar menampilkan Kanban, Keuangan, AI Scanner, Audit Log.

### A3. Create user dengan `user_metadata.role=manager`
**Langkah:**
1. Buat user baru dengan `user_metadata.role = manager` (tanpa app_metadata.role).
2. Login pertama.

**Ekspektasi:**
- Role bootstrap fallback ke `user_metadata` jika `app_metadata` tidak ada.
- `users.role` menjadi `manager`.

### A4. Negative test untuk nilai role tidak valid
**Langkah:**
1. Set `app_metadata.role = "superadmin"` (nilai tidak valid).
2. Login ke aplikasi.

**Ekspektasi:**
- Sistem menormalisasi/fallback ke role aman (`user`) sesuai policy.
- User tidak mendapatkan akses admin/manager.

---

## Skenario B — Login & Session Behavior

### B1. Login berhasil + redirect benar
**Langkah:**
1. Login user valid.
2. Akses `/login` kembali saat sudah login.

**Ekspektasi:**
- User diarahkan ke halaman protected (dashboard `/`).
- Akses ke `/login` saat sudah login di-redirect ke dashboard.

### B2. Login gagal
**Langkah:**
1. Login dengan password salah.

**Ekspektasi:**
- Aplikasi menampilkan error auth.
- Tidak ada akses ke protected route.

### B3. Logout
**Langkah:**
1. Login valid.
2. Klik logout.
3. Coba akses route protected langsung.

**Ekspektasi:**
- Session terhapus.
- Route protected redirect ke `/login`.

---

## Skenario C — RBAC UI (Sidebar Visibility)

## C1. Admin
**Ekspektasi menu minimal terlihat:**
- Dashboard
- Proyek
- Entitas
- Transaksi
- Keuangan
- Kanban
- AI Scanner
- AI Pilot
- Pengaturan
- Audit Log

## C2. Manager
**Ekspektasi menu minimal terlihat:**
- Dashboard
- Proyek
- Entitas
- Transaksi
- Keuangan
- Kanban
- AI Scanner
- AI Pilot
- Pengaturan

**Ekspektasi menu tidak terlihat:**
- Audit Log (admin-only)

## C3. User
**Ekspektasi menu terbatas (sesuai policy saat ini):**
- Dashboard
- Proyek
- Entitas
- Transaksi
- AI Pilot
- Pengaturan

**Ekspektasi menu tidak terlihat:**
- Keuangan
- Kanban
- AI Scanner
- Audit Log

---

## Skenario D — Route Guard (Middleware)

### D1. Admin akses admin route
**Langkah:** akses `/admin/audit` sebagai admin.
**Ekspektasi:** diizinkan.

### D2. Manager/User akses admin route
**Langkah:** akses `/admin/audit` sebagai manager/user.
**Ekspektasi:** ditolak/redirect ke `/`.

### D3. User akses manager route
**Langkah:** akses `/kanban` / `/keuangan` / `/scanner` sebagai user.
**Ekspektasi:** ditolak/redirect.

---

## Skenario E — API Authorization (Final Security Boundary)

Gunakan Postman/curl/REST client dengan session user terkait.

### E1. Admin-only API
- Endpoint contoh: `/api/admin/users`

**Ekspektasi:**
- Admin: sukses (200).
- Manager/User: `403 Forbidden`.

### E2. Resource CRUD by permission
Uji endpoint projects/tasks/transactions/entities sesuai role matrix.

**Ekspektasi:**
- Aksi di luar permission role harus `403`.
- Aksi yang diizinkan sukses.

### E3. RBAC Metrics Endpoint (Admin-only)
- Endpoint: `/api/admin/rbac/metrics`

**Ekspektasi:**
- Admin: sukses (200) dan payload metrik terbaca.
- Manager/User: `403 Forbidden`.
- Unauthenticated: `401 Unauthorized`.

---

## Skenario F — Provisioning & Role Source Consistency

### F1. Existing Turso role tetap authoritative
**Langkah:**
1. Pastikan user existing di Turso role=`admin`.
2. Kosongkan metadata role di Supabase.
3. Login.

**Ekspektasi:**
- Effective role tetap `admin`.

### F2. Metadata berubah, existing Turso role berbeda
**Langkah:**
1. Turso role=`manager`.
2. Supabase metadata set `admin`.
3. Login.

**Ekspektasi:**
- Untuk user existing, **Turso `users.role` tetap authoritative**.
- Metadata Supabase (`app_metadata`/`user_metadata`) tidak boleh overwrite role existing secara otomatis.
- Effective role tetap `manager` sampai ada role change resmi via admin flow.

---

## Skenario G — Role Change via Admin Flow

### G1. Admin mengubah role user
**Langkah:**
1. Login sebagai admin.
2. Ubah role user melalui API/UI admin users.

**Ekspektasi:**
- Update berhasil.
- Perubahan role langsung berdampak pada menu dan akses endpoint user target.
- Audit log perubahan role tercatat.

### G2. Non-admin mencoba ubah role
**Ekspektasi:**
- Ditolak (`403`).
- Tidak ada perubahan data role.

### G3. Role change tanpa `reason` (hardening mandatory)
**Langkah:**
1. Login sebagai admin.
2. Panggil update role user target tanpa field `reason`.
3. Ulangi dengan `reason` berisi string kosong/whitespace.

**Ekspektasi:**
- Request ditolak (`400`).
- Response menyatakan reason wajib untuk role change.
- Tidak ada perubahan role di database.

### G4. Payload liar / role invalid / self-demotion admin terakhir

**Case 1 — Payload field liar (strict validation):**
- Tambahkan field yang tidak dikenal pada body (mis. `isSuperAdmin: true`).
- **Ekspektasi:** `400 Invalid payload`.

**Case 2 — Role invalid:**
- Kirim role di luar enum (`superadmin`).
- **Ekspektasi:** request ditolak (`400`), role tidak berubah.

**Case 3 — Self-demotion admin terakhir:**
- Siapkan kondisi hanya tersisa 1 admin.
- Admin tersebut mencoba menurunkan role dirinya (`admin -> manager/user`).
- **Ekspektasi:** `400` dengan pesan gagal self-demotion admin terakhir.

---

## Skenario H — Auditability & Logging

### H1. Access denied log
**Langkah:** user tanpa hak akses memaksa akses route/API terproteksi.

**Ekspektasi:**
- Event access denied tercatat dengan context minimal:
  - userId
  - role/effectiveRole
  - path
  - reason
  - timestamp

### H2. Role change log
**Ekspektasi:**
- Tercatat `oldRole`, `newRole`, `actorId`, `reason`, `timestamp`.

### H3. Metrics consistency check
**Langkah:**
1. Trigger beberapa request deny (manager/user akses endpoint admin).
2. Trigger role change valid oleh admin.
3. Hit endpoint `/api/admin/rbac/metrics` sebagai admin.

**Ekspektasi:**
- Metrik `deniedByRole` meningkat sesuai percobaan deny.
- Metrik `roleChangeEvents` bertambah setelah role change sukses.
- `provisioningFailures` tidak naik tanpa incident provisioning.

---

## 4) Regression Test Khusus Bug Awal

Bug awal: user yang seharusnya admin tidak melihat menu `KANBAN`, `KEUANGAN`, `AI SCANNER`, `AUDIT LOG`.

### Test Regresi Wajib
1. Siapkan akun dengan role admin valid.
2. Login ke aplikasi.
3. Verifikasi sidebar memunculkan semua menu di atas.
4. Verifikasi akses halaman/route terkait sukses.
5. Verifikasi endpoint admin users juga bisa diakses.

**Pass criteria:** semua langkah di atas lulus tanpa workaround manual.

---

## 5) Data Template untuk Test User

Gunakan tabel ini untuk tracking hasil uji.

| Email Test | Supabase app_metadata.role | Supabase user_metadata.role | Turso users.role (expected) | Login | Sidebar | API Admin | Notes |
|---|---|---|---|---|---|---|---|
| test-admin-1@... | admin | - | admin |  |  |  |  |
| test-manager-1@... | - | manager | manager |  |  |  |  |
| test-user-1@... | - | - | user |  |  |  |  |

---

## 6) UAT Sign-Off Checklist

- [ ] QA sign-off: semua skenario A-H lulus.
- [ ] Product sign-off: role visibility sesuai kebutuhan bisnis.
- [ ] Security sign-off: endpoint protection + audit trail valid.
- [ ] Engineering sign-off: regression test ditambahkan untuk bug awal.

---

## 7) Evidence Template (Wajib Isi saat QA/UAT)

Gunakan format ini untuk setiap skenario yang dijalankan:

| Scenario ID | Status (PASS/FAIL/BLOCKED) | Tester | Timestamp (UTC) | Evidence Type | Evidence Link/Path | Catatan |
|---|---|---|---|---|---|---|
| A1 |  |  |  | screenshot / API response / log snapshot |  |  |

### Evidence minimum per kategori
- **UI visibility**: screenshot sidebar + halaman tujuan.
- **Route guard**: screenshot redirect/blocked state.
- **API authorization**: request + response body + status code.
- **Observability**: snapshot log/audit atau hasil endpoint metrics.
- **Role change**: before/after role + audit entry (`oldRole`, `newRole`, `actorId`, `reason`, `timestamp`).

---

## 8) Catatan Eksekusi

1. Jalankan testing minimal pada environment staging sebelum production.
2. Jika ada policy sinkronisasi role yang berubah, update dokumen ini dan `rbac-auth-master-plan.md`.
3. Semua temuan bug selama test dicatat sebagai issue terpisah dengan severity.
4. Referensi operasional release/rollback gunakan checklist Phase 5: `docs/issues/rbac/phase-5-rbac-rollout-rollback-checklist.md`.
