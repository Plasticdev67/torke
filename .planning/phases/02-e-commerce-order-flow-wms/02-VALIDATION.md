---
phase: 02
slug: e-commerce-order-flow-wms
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-04
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts (Wave 0 creates if missing) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | SHOP-06 | unit | `npx vitest run src/__tests__/cart` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | SHOP-07, SHOP-08 | unit | `npx vitest run src/__tests__/checkout` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | SHOP-10 | integration | `npx vitest run src/__tests__/stripe` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | SHOP-09 | unit | `npx vitest run src/__tests__/bacs` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | TRACE-07, WMS-02 | unit | `npx vitest run src/__tests__/allocation` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | WMS-08 | unit | `npx vitest run src/__tests__/picklist` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 1 | WMS-09, WMS-10 | unit | `npx vitest run src/__tests__/dispatch` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | TRACE-09, TRACE-11 | unit | `npx vitest run src/__tests__/certpack` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 2 | TRACE-10 | unit | `npx vitest run src/__tests__/email` | ❌ W0 | ⬜ pending |
| 02-04-01 | 04 | 2 | SHOP-14, SHOP-15 | unit | `npx vitest run src/__tests__/orders` | ❌ W0 | ⬜ pending |
| 02-04-02 | 04 | 2 | SHOP-16 | unit | `npx vitest run src/__tests__/invoice` | ❌ W0 | ⬜ pending |
| 02-04-03 | 04 | 2 | WMS-03, WMS-04 | unit | `npx vitest run src/__tests__/stock` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — vitest configuration with path aliases
- [ ] `src/__tests__/setup.ts` — test setup with mocks for Drizzle, tRPC
- [ ] `src/__tests__/cart/` — cart store test stubs
- [ ] `src/__tests__/checkout/` — checkout flow test stubs
- [ ] `src/__tests__/stripe/` — Stripe webhook test stubs
- [ ] `src/__tests__/allocation/` — FIFO allocation test stubs
- [ ] `src/__tests__/certpack/` — cert pack generation test stubs

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Stripe checkout redirect + SCA | SHOP-10 | Requires Stripe test mode browser interaction | Use test card 4242... in Stripe checkout, verify redirect back |
| Cert pack PDF visual layout | TRACE-09, TRACE-11 | PDF visual verification | Open generated cert pack, verify cover page + appended certs |
| Thermal label printing | WMS-06 | Physical device required | Print test label, verify QR scans correctly |
| Email delivery | TRACE-10 | External service | Check Resend dashboard for dispatch emails |
| SHOP-11 address selection UX | SHOP-11 | Visual/UX verification | Verify address dropdown works with multiple saved addresses |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
