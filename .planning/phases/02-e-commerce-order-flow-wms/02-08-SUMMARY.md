---
phase: 02-e-commerce-order-flow-wms
plan: 08
subsystem: api, ui
tags: [certpack, traceability, batch-allocation, r2, pdf]

# Dependency graph
requires:
  - phase: 02-e-commerce-order-flow-wms (plan 05)
    provides: certpack-service with generateCertPack function
  - phase: 02-e-commerce-order-flow-wms (plan 04)
    provides: dispatch mutation with placeholder for cert pack
  - phase: 02-e-commerce-order-flow-wms (plan 06)
    provides: email-service with dispatch notification and cert attachment logic
provides:
  - dispatch mutation triggers cert pack generation and chains email notification
  - checkout success page shows batch allocation traceability per line item
affects: [phase-02-verification, phase-03-planning]

# Tech tracking
tech-stack:
  added: []
  patterns: [fire-and-forget promise chain for async post-transaction work]

key-files:
  created: []
  modified:
    - src/server/trpc/routers/orders.ts
    - src/app/(shop)/checkout/success/page.tsx

key-decisions:
  - "generateCertPack chained before sendDispatchNotification via .then() so email can attach PDF"
  - "Used 'in' operator type guard for allocations property to handle mixed order types from list vs myOrderDetail"

patterns-established:
  - "Promise chain pattern: generateCertPack().then(() => sendEmail()).catch() for ordered fire-and-forget"

requirements-completed: [TRACE-07, TRACE-09, TRACE-10, WMS-10]

# Metrics
duration: 4min
completed: 2026-03-05
---

# Phase 2 Plan 8: Gap Closure Summary

**Dispatch-to-certpack wiring and batch allocation display on checkout success page closing 4 traceability gaps**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-05T00:35:00Z
- **Completed:** 2026-03-05T00:39:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Wired generateCertPack into dispatch mutation replacing console.log placeholder, with chained email notification
- Added Torke Batch ID column to checkout success page using myOrderDetail query for allocation data
- "Pending allocation" gracefully handles card orders awaiting Stripe webhook

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire generateCertPack into dispatch mutation** - `80cf6b0` (feat)
2. **Task 2: Add batch allocation column to checkout success page** - `e69c0c7` (feat)

## Files Created/Modified
- `src/server/trpc/routers/orders.ts` - Added certpack-service import, replaced placeholder with fire-and-forget generateCertPack chained to sendDispatchNotification
- `src/app/(shop)/checkout/success/page.tsx` - Added myOrderDetail query for allocation data, Torke Batch ID column with pending allocation fallback

## Decisions Made
- generateCertPack chained before sendDispatchNotification via .then() so the dispatch email can attach the cert pack PDF (certPackKey is set by generateCertPack)
- Used runtime 'in' operator check for allocations property to handle the union type between list query (no allocations) and myOrderDetail query (has allocations)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript errors in unrelated files (test files, StockAdjustmentForm, .next types) - not caused by this plan's changes, ignored per scope boundary rules

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 2 gap closure complete - all 4 traceability requirements (TRACE-07, TRACE-09, TRACE-10, WMS-10) are now satisfied
- Dispatch flow: transition -> cert pack generation -> email with attachment is fully wired
- Checkout success shows batch traceability to end customers
- Phase 2 is ready for final verification

---
*Phase: 02-e-commerce-order-flow-wms*
*Completed: 2026-03-05*
