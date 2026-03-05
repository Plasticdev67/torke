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
| 03-00-01 | 00 | 0 | DESIGN-01 | unit | `npx vitest run src/__tests__/design/` | ❌ W0 | ⬜ pending |
| 03-01-01 | 01 | 1 | DESIGN-01,02,03 | unit | `npx vitest run src/__tests__/design/calc-engine.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | DESIGN-04,05 | unit | `npx vitest run src/__tests__/design/failure-modes.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | DESIGN-06 | unit | `npx vitest run src/__tests__/design/calc-validation.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | DESIGN-08,09,10 | manual | Visual inspection of 3D scene | N/A | ⬜ pending |
| 03-03-01 | 03 | 2 | DESIGN-02 | integration | `npx vitest run src/__tests__/design/input-form.test.ts` | ❌ W0 | ⬜ pending |
| 03-04-01 | 04 | 3 | DESIGN-11,12,13 | unit | `npx vitest run src/__tests__/design/calc-report.test.ts` | ❌ W0 | ⬜ pending |
| 03-05-01 | 05 | 3 | DESIGN-14,15,16 | integration | `npx vitest run src/__tests__/design/design-to-order.test.ts` | ❌ W0 | ⬜ pending |
| 03-06-01 | 06 | 4 | DESIGN-17,18,19 | integration | `npx vitest run src/__tests__/design/access-gating.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/design/calc-engine.test.ts` — stubs for DESIGN-01,02,03 (failure mode calculations)
- [ ] `src/__tests__/design/failure-modes.test.ts` — stubs for DESIGN-04,05 (utilisation ratios, anchor groups)
- [ ] `src/__tests__/design/calc-validation.test.ts` — stubs for DESIGN-06 (client/server parity)
- [ ] `src/__tests__/design/input-form.test.ts` — stubs for DESIGN-02 (input parameter validation)
- [ ] `src/__tests__/design/calc-report.test.ts` — stubs for DESIGN-11,12,13 (PDF report generation)
- [ ] `src/__tests__/design/design-to-order.test.ts` — stubs for DESIGN-14,15,16 (product matching, cart integration)
- [ ] `src/__tests__/design/access-gating.test.ts` — stubs for DESIGN-17,18,19 (free access, gated export)
- [ ] `src/__tests__/design/regression/` — directory for PROFIS validation fixtures

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
