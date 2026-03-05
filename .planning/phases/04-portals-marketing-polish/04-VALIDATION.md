---
phase: 4
slug: portals-marketing-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-05
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --coverage` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | TRACE-12 | unit | `npx vitest run src/__tests__/certs/cert-search.test.ts -x` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | TRACE-13 | unit | `npx vitest run src/__tests__/certs/bulk-download.test.ts -x` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | TRACE-14 | unit | `npx vitest run src/__tests__/certs/cert-links.test.ts -x` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | TRACE-15 | unit | `npx vitest run src/__tests__/verification/share-token.test.ts -x` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 1 | TRACE-16 | unit | `npx vitest run src/__tests__/verification/order-verify.test.ts -x` | ❌ W0 | ⬜ pending |
| 04-02-03 | 02 | 1 | TRACE-17 | manual-only | Manual: scan QR on label, verify page loads | N/A | ⬜ pending |
| 04-03-01 | 03 | 2 | MKTG-01 | unit | `npx vitest run src/__tests__/blog/mdx-utils.test.ts -x` | ❌ W0 | ⬜ pending |
| 04-03-02 | 03 | 2 | MKTG-02 | unit | `npx vitest run src/__tests__/seo/schema-markup.test.ts -x` | ❌ W0 | ⬜ pending |
| 04-03-03 | 03 | 2 | MKTG-03 | manual-only | Manual: visit /resources, verify downloads | N/A | ⬜ pending |
| 04-03-04 | 03 | 2 | MKTG-04 | unit | `npx vitest run src/__tests__/blog/glossary.test.ts -x` | ❌ W0 | ⬜ pending |
| 04-04-01 | 04 | 3 | MKTG-05 | manual-only | Manual: visit /design in incognito | N/A | ⬜ pending |
| 04-04-02 | 04 | 3 | MKTG-06 | unit | `npx vitest run src/__tests__/leads/lead-capture.test.ts -x` | ❌ W0 | ⬜ pending |
| 04-04-03 | 04 | 3 | MKTG-07 | manual-only | Manual: register via design, visit shop | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/certs/cert-search.test.ts` — stubs for TRACE-12
- [ ] `src/__tests__/certs/bulk-download.test.ts` — stubs for TRACE-13
- [ ] `src/__tests__/certs/cert-links.test.ts` — stubs for TRACE-14
- [ ] `src/__tests__/verification/share-token.test.ts` — stubs for TRACE-15
- [ ] `src/__tests__/verification/order-verify.test.ts` — stubs for TRACE-16
- [ ] `src/__tests__/blog/mdx-utils.test.ts` — stubs for MKTG-01
- [ ] `src/__tests__/seo/schema-markup.test.ts` — stubs for MKTG-02
- [ ] `src/__tests__/blog/glossary.test.ts` — stubs for MKTG-04
- [ ] `src/__tests__/leads/lead-capture.test.ts` — stubs for MKTG-06

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| QR code on product box links to cert page | TRACE-17 | Physical QR scan required | Scan QR on product label with phone camera, verify page loads with batch details |
| Resource library downloads work | MKTG-03 | R2 presigned URL + browser download | Visit /resources, click download on a datasheet, verify PDF opens |
| Design tool accessible without login | MKTG-05 | Full browser session test | Visit /design in incognito, verify calculator loads and runs |
| Design account works in shop | MKTG-07 | Cross-feature session flow | Register via /design, navigate to /shop, verify account carries over |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
