# [RBAC] Umbrella: Auth & RBAC Hardening Master Plan

> Status: **Implemented**
>
> Effective date: 2026-04-17
> Owner: Engineering

## Context
Issue ini menjadi tracking utama implementasi roadmap pada `rbac-auth-master-plan.md` untuk memastikan bug role admin dan akses sidebar tidak terulang.

## Objective
- Menyatukan flow auth/role sesuai standar:
  - Supabase = authentication/session
  - Turso `users.role` = authorization source of truth
- Menutup gap governance, testing, dan observability RBAC.

## Scope
Sub-issues per fase:
- [x] Phase 0 — Governance Lock
- [x] Phase 1 — Role Resolution Consolidation
- [x] Phase 2 — Permission-Driven Navigation & Route Policy
- [x] Phase 3 — Admin Role Management Hardening
- [x] Phase 4 — Test Matrix & Quality Gates
- [x] Phase 5 — Observability, Runbook, Rollout

## Definition of Done (Program Level)
- [x] Role admin konsisten di UI, middleware, API.
- [x] Menu admin (Kanban, Keuangan, AI Scanner, Audit Log) tampil untuk admin valid.
- [x] Endpoint admin hanya bisa diakses admin.
- [x] Role change ter-audit.
- [x] RBAC tests masuk CI dan lulus.

## Program Notes
- Seluruh phase doc `01` s/d `06` sudah berstatus **Implemented** dengan deliverables dan acceptance criteria tercentang.
- Artefak operasional Phase 5 tersedia di:
  - `docs/issues/rbac/phase-5-rbac-incident-runbook.md`
  - `docs/issues/rbac/phase-5-rbac-rollout-rollback-checklist.md`
  - `docs/issues/rbac/route-to-permission-mapping.md`
- Checklist kosong di dokumen rollout/rollback adalah **checklist operasional saat release berjalan** (bukan item implementasi kode yang tertunda).

## Reference
- `rbac-auth-master-plan.md`
