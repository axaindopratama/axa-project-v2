# [RBAC][Phase 5] Observability, Runbook, Rollout

> Status: **Implemented**
>
> Effective date: 2026-04-17
> Owner: Engineering

## Objective
Meningkatkan visibilitas dan kesiapan operasional saat terjadi incident RBAC di produksi.

## Deliverables
- [x] Structured logging untuk decision RBAC (`effectiveRole`, `roleSource`, `path`, `decision`, `reason`).
- [x] Dashboard metrik: denied access by role, role-change events, provisioning failures.
- [x] Runbook troubleshooting (termasuk kasus menu admin tidak muncul).
- [x] Rollout + rollback plan untuk perubahan policy RBAC.

## Implementation Notes
- Structured RBAC decision logging diperluas agar mencakup jalur ALLOW dan DENY:
  - `src/lib/audit.ts`
    - `logRbacDecision(...)`
    - `getRbacMetrics()` agregasi `deniedByRole`, `roleChangeEvents`, `provisioningFailures`.
  - `src/middleware.ts`
    - logging decision untuk provisioning failure, route deny, route allow, serta API-route delegation.
  - `src/lib/auth.ts`
    - logging decision untuk unauthenticated request, provisioning failure, dan authenticated allow.
  - `src/app/api/admin/users/route.ts`
    - logging decision untuk admin context unauthorized/forbidden/allowed.
- Endpoint metrik RBAC admin ditambahkan:
  - `src/app/api/admin/rbac/metrics/route.ts`
  - akses admin-only; mengembalikan metrik observability dari `getRbacMetrics()`.
- Dokumen operasional ditambahkan:
  - `docs/issues/rbac/phase-5-rbac-incident-runbook.md`
  - `docs/issues/rbac/phase-5-rbac-rollout-rollback-checklist.md`

## Acceptance Criteria
- [x] Incident RBAC bisa ditelusuri < 15 menit via log + runbook.
- [x] Tim ops memiliki SOP verifikasi pasca deploy.
- [x] Tidak ada perubahan RBAC besar tanpa checklist rollout.

## Dependencies
- Depends on: Phase 3, Phase 4
