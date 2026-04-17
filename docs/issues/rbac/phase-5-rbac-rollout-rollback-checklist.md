# RBAC Policy Rollout & Rollback Checklist (Phase 5)

Checklist wajib setiap perubahan policy RBAC yang berdampak route, permission, atau otorisasi endpoint.

## Pre-Deploy (Wajib)
- [ ] Perubahan policy terdokumentasi (scope route/permission/role affected).
- [ ] `route-to-permission-mapping.md` sudah sinkron terhadap perubahan.
- [ ] Jalankan local gate:
  - [ ] `npm run lint`
  - [ ] `npm run rbac:guard:metadata-role`
  - [ ] `npm run rbac:quality-gate`
- [ ] Verifikasi role authority tetap Turso-first (tidak ada overwrite existing role dari metadata).
- [ ] Uji smoke role utama (admin/manager/user) untuk route kritikal.
- [ ] Approval engineering lead untuk rollout.

## Deploy Steps
1. Deploy ke environment target sesuai pipeline standar.
2. Catat release timestamp + commit hash.
3. Umumkan jendela observasi RBAC (minimal 30 menit) ke tim ops.

## Monitoring Window (30 Menit Pertama)
- [ ] T+5m: cek `GET /api/admin/rbac/metrics` dan catat baseline awal.
- [ ] T+15m: bandingkan tren `deniedByRole` (jangan ada lonjakan anomali).
- [ ] T+30m: pastikan `provisioningFailures` stabil dan tidak meningkat signifikan.
- [ ] Simpan snapshot hasil monitoring di change record.

## Post-Deploy Verification (Ops SOP)
- [ ] Cek endpoint metrik RBAC: `GET /api/admin/rbac/metrics`.
- [ ] Validasi tidak ada lonjakan abnormal:
  - [ ] `deniedByRole`
  - [ ] `provisioningFailures`
- [ ] Validasi route kritikal:
  - [ ] `/admin/users` (admin only)
  - [ ] `/admin/audit` (admin only)
  - [ ] route bisnis non-admin tetap accessible sesuai permission.
- [ ] Sampling audit log `tableName='rbac'` menunjukkan `effectiveRole`, `roleSource`, `decision`, `reason` terisi.
- [ ] Tidak ada incident severity tinggi selama observasi awal.

## Trigger Rollback
Lakukan rollback jika salah satu terjadi:
- Persentase `ACCESS_DENIED` melonjak signifikan vs baseline normal.
- Admin kehilangan akses massal ke route admin.
- Provisioning failure meningkat dan mengganggu akses user.
- Incident RBAC tidak teratasi <= 15 menit lewat runbook.

## Rollback Procedure
1. Revert ke commit terakhir stabil terkait policy RBAC.
2. Redeploy rollback build.
3. Jalankan kembali post-deploy verification checklist.
4. Konfirmasi metrik kembali normal.
5. Publikasikan status rollback + rencana perbaikan permanen.

## Komando Verifikasi Cepat
```bash
npm run rbac:ci
```

```bash
curl -sS -X GET http://localhost:3000/api/admin/rbac/metrics
```

## Sign-off
- [ ] Engineering Lead
- [ ] On-call Ops
- [ ] Product owner (jika perubahan menyentuh akses fitur bisnis kritikal)

## Change Record Template
- Tanggal/Waktu:
- Commit hash:
- Perubahan policy:
- Route/permission impacted:
- Hasil pre-deploy gate:
- Hasil post-deploy verifikasi:
- Keputusan: lanjut / rollback
- PIC:
