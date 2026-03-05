---
phase: 3
slug: torke-design
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-05
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | DESIGN-01,02,03 | unit | `npx vitest run src/__tests__/calc-engine/calc-engine.test.ts` | No (created in Plan 01 Task 1) | pending |
| 03-01-02 | 01 | 1 | DESIGN-04,05,06,07 | unit | `npx vitest run src/__tests__/calc-engine/failure-modes.test.ts` | No (created in Plan 01 Task 1) | pending |
| 03-02-01 | 02 | 1 | DESIGN-02,17 | type-check | `npx tsc --noEmit 2>&1 \| head -20` | N/A | pending |
| 03-02-02 | 02 | 1 | DESIGN-02 | type-check | `npx tsc --noEmit 2>&1 \| head -20` | N/A | pending |
| 03-03-01 | 03 | 2 | DESIGN-08,09,10 | type-check | `npx tsc --noEmit 2>&1 \| head -20` | N/A | pending |
| 03-03-02 | 03 | 2 | DESIGN-08,10 | manual | Visual inspection of 3D scene | N/A | pending |
| 03-04-01 | 04 | 2 | DESIGN-04 | type-check | `npx tsc --noEmit 2>&1 \| head -20` | N/A | pending |
| 03-04-02 | 04 | 2 | DESIGN-04 | type-check | `npx tsc --noEmit 2>&1 \| head -20` | N/A | pending |
| 03-05-01 | 05 | 3 | DESIGN-06,11,12,13 | unit | `npx vitest run src/__tests__/calc-report/calc-report.test.ts` | No (created in Plan 05 Task 1) | pending |
| 03-05-02 | 05 | 3 | DESIGN-18 | type-check | `npx tsc --noEmit 2>&1 \| head -20` | N/A | pending |
| 03-06-01 | 06 | 4 | DESIGN-14,15,16,19 | type-check | `npx tsc --noEmit 2>&1 \| head -20` | N/A | pending |
| 03-06-02 | 06 | 4 | DESIGN-17,18 | type-check | `npx tsc --noEmit 2>&1 \| head -20` | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave-Level Build Verification

| Wave | Plans | Build Command | When |
|------|-------|---------------|------|
| 1 | 01, 02 | `npx next build 2>&1 \| tail -10` | After all Wave 1 plans complete |
| 2 | 03, 04 | `npx next build 2>&1 \| tail -10` | After all Wave 2 plans complete |
| 3 | 05 | `npx next build 2>&1 \| tail -10` | After Wave 3 plans complete |
| 4 | 06 | `npx next build 2>&1 \| tail -10` | After Wave 4 plans complete |

---

## Wave 0 Requirements

- [ ] `src/__tests__/calc-engine/calc-engine.test.ts` -- stubs for calc engine pipeline (created by Plan 01 Task 1)
- [ ] `src/__tests__/calc-engine/failure-modes.test.ts` -- stubs for failure mode calculations (created by Plan 01 Task 1)
- [ ] `src/__tests__/calc-engine/groups.test.ts` -- stubs for group geometry (created by Plan 01 Task 1)
- [ ] `src/__tests__/calc-engine/deterministic.test.ts` -- stubs for determinism check (created by Plan 01 Task 1)
- [ ] `src/__tests__/calc-report/calc-report.test.ts` -- stubs for PDF report generation (created by Plan 05 Task 1)

*Note: Plan 01 is a TDD plan that creates its own test scaffolds in Task 1. Plan 05 Task 1 is TDD and creates its test file. No separate Wave 0 plan is needed.*

*Existing vitest infrastructure from Phase 2 covers framework setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 3D model renders and responds to orbit controls | DESIGN-08,10 | WebGL requires browser | Open /design, verify model renders, try rotate/zoom/pan |
| 3D model updates in real time with input changes | DESIGN-09 | WebGL + DOM interaction | Change diameter/spacing inputs, verify model updates within 300ms |
| Failure cone overlays display correctly | DESIGN-08 | Visual geometry verification | Toggle each failure mode cone, verify correct shape and colour |
| PDF report renders correctly with Torke branding | DESIGN-11 | Visual PDF inspection | Export PDF, verify cover page, clause references, layout |
| Scope limitation disclaimers visible | DESIGN-07 | Visual verification | Check calculation output and PDF for "no seismic, no fire" disclaimers |
| CEng verification of calc results | Success Criteria 5 | Engineering validation | Compare 5-10 results against PROFIS outputs and Eurocode worked examples |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
