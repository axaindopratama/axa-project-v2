# RBAC Incident Runbook (Phase 5)

> Tujuan: mempercepat triage dan recovery incident RBAC produksi (target < 15 menit).

## Scope Incident
- User tidak bisa akses route yang seharusnya boleh.
- Menu admin tidak muncul untuk user admin.
- API admin mengembalikan 401/403 tidak sesuai ekspektasi.
- Lonjakan `ACCESS_DENIED` atau `user_provisioning_failed`.

## Sumber Data Observability
- **Structured RBAC audit log** (`audit_logs`):
  - `action`: `ACCESS_ALLOWED` / `ACCESS_DENIED`
  - `tableName`: `rbac`
  - `recordId`: path request
  - `newValue` JSON:
    - `path`, `method`, `effectiveRole`, `roleSource`, `decision`, `reason`, `metadata`
- **Role-change event**:
  - `action`: `ROLE_CHANGE`
- **RBAC metrics endpoint**:
  - `GET /api/admin/rbac/metrics`
  - output: `deniedByRole`, `roleChangeEvents`, `provisioningFailures`, `sampledLogCount`

## Query Cepat (Ops)

### 1) Log RBAC terbaru (200 row)
```sql
SELECT created_at, user_id, action, table_name, record_id, new_value
FROM audit_logs
WHERE table_name = 'rbac'
ORDER BY created_at DESC
LIMIT 200;
```

### 2) Semua deny untuk path tertentu
```sql
SELECT created_at, user_id, record_id, new_value
FROM audit_logs
WHERE table_name = 'rbac'
  AND action = 'ACCESS_DENIED'
  AND record_id = '/admin/users'
ORDER BY created_at DESC;
```

### 3) Role change terbaru
```sql
SELECT created_at, user_id, record_id, old_value, new_value
FROM audit_logs
WHERE action = 'ROLE_CHANGE'
ORDER BY created_at DESC
LIMIT 50;
```

## SLA Triage (15 Menit)
1. **0-5 menit**: konfirmasi symptom, role user terdampak, path yang gagal.
2. **5-10 menit**: validasi log RBAC + status role di Turso (`users.role`).
3. **10-15 menit**: tentukan root cause sementara + mitigasi (rollback policy / perbaikan role data / hotfix).

## Prosedur Standar Triage

### 1) Kumpulkan Konteks Cepat
- User terdampak (`supabaseUserId` / email).
- Path dan method request.
- Timestamp kejadian (UTC).

### 2) Verifikasi Role Authority
- Cek `users.role` di Turso untuk user terdampak.
- Pastikan tidak mengandalkan metadata Supabase untuk user existing.
- Jika ada mismatch role, prioritas perbaikan di Turso (admin flow resmi).

### 3) Cek Structured RBAC Logs
- Filter `audit_logs` dengan:
  - `tableName='rbac'`
  - `recordId=<path>`
  - rentang waktu kejadian
- Identifikasi:
  - `decision=DENY` + `reason`
  - `effectiveRole`
  - `roleSource` (`turso` vs `supabase_metadata` vs `unknown`)

### 4) Cek Metrik Agregat
- Hit endpoint `GET /api/admin/rbac/metrics` sebagai admin.
- Fokus:
  - spike `deniedByRole`
  - `provisioningFailures` > baseline
  - korelasi dengan `ROLE_CHANGE` terbaru

Contoh cepat:
```bash
curl -sS -X GET http://localhost:3000/api/admin/rbac/metrics
```

### 5) Pilih Mitigasi
- **Role salah di data**: koreksi via admin role management (beralasan + audit).
- **Policy route salah**: rollback policy ke commit terakhir stabil.
- **Provisioning failure**: perbaiki error provisioning, sementara arahkan user ke flow setup.

---

## Playbook Kasus: “Menu Admin Tidak Muncul”

### Gejala
- User mengaku admin, tapi menu `/admin/users` dan/atau `/admin/audit` tidak muncul di sidebar.

### Langkah Diagnostik
1. Cek `users.role` di Turso untuk user tsb.
2. Cek log middleware pada path protected untuk user tsb:
   - `decision`, `effectiveRole`, `reason`.
3. Cek apakah `canAccessRoute` memutuskan deny (`route_guard_denied`).
4. Validasi policy mapping route:
   - `docs/issues/rbac/route-to-permission-mapping.md`
   - `src/lib/rbac.ts` (`ROUTE_PERMISSIONS`, `ROLE_PERMISSIONS`)
5. Jalankan regression gate lokal:
   - `npm run rbac:quality-gate`

### Kemungkinan Akar Masalah
- Role user di Turso bukan `admin`.
- Permission `audit:read` / `users:read` tidak dimiliki role target.
- Drift policy akibat perubahan route mapping.

### Mitigasi Cepat
- Perbaiki role di flow admin resmi (dengan reason).
- Rollback perubahan policy yang menyebabkan drift.
- Jalankan ulang gate CI RBAC sebelum redeploy.

### Verifikasi Recovery
1. Login ulang user terdampak.
2. Pastikan sidebar menampilkan menu admin.
3. Validasi request route admin menghasilkan `ACCESS_ALLOWED` dengan:
   - `effectiveRole=admin`
   - `roleSource=turso`
   - `reason=route_guard_allowed` atau `admin_context_allowed`.

## Exit Criteria Incident
- User dapat akses sesuai role dan policy.
- Tidak ada deny tidak wajar dalam 30 menit observasi.
- RCA singkat + tindakan pencegahan didokumentasikan.
