---
phase: 03-torke-design
plan: 06
subsystem: ui
tags: [react, trpc, auth, cart, design-tool, product-recommendations]

# Dependency graph
requires:
  - phase: 03-torke-design/02
    provides: "Design input surface with design store"
  - phase: 03-torke-design/04
    provides: "Results panel and action bar stubs"
  - phase: 03-torke-design/05
    provides: "Calculations router (save, load, list, exportPdf, delete)"
provides:
  - "ProductRecommendations component matching anchor type/diameter to products"
  - "Cart integration with calcReference from design tool"
  - "AuthGateModal for sign-up/sign-in gating on save/export"
  - "Saved calculations page with load/delete"
  - "calcReference passed through orders to order lines"
affects: [03-torke-design, 02-e-commerce-order-flow-wms]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Auth gate modal pattern: overlay preserves calculation state in design store"
    - "Pending action callback: auth modal triggers original action after sign-up/sign-in"
    - "Product recommendations query existing product database by category and diameter"

key-files:
  created:
    - src/components/design/ProductRecommendations.tsx
    - src/components/design/AuthGateModal.tsx
    - src/app/(design)/design/saved/page.tsx
  modified:
    - src/components/design/ActionBar.tsx
    - src/app/(design)/design/page.tsx
    - src/server/trpc/routers/orders.ts
    - src/server/services/order-service.ts

key-decisions:
  - "Auth gate uses overlay modal (not redirect) to preserve localStorage-persisted design state"
  - "Draft calcReference uses DESIGN-DRAFT-{timestamp} when calculation not yet saved"
  - "Product diameter filter uses M-prefix format (M12, M16) matching product database"

patterns-established:
  - "Auth gate pattern: check session, open modal if unauthenticated, callback triggers pending action"
  - "Confirmation dialog pattern: inline confirm/cancel buttons replacing action button"

requirements-completed: [DESIGN-14, DESIGN-15, DESIGN-16, DESIGN-19]

# Metrics
duration: 5min
completed: 2026-03-05
---

# Phase 3 Plan 06: Design-to-Order Pipeline Summary

**Product recommendations from shared catalogue, cart integration with calcReference, auth-gated save/export with inline sign-up modal, and saved calculations management page**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-05T08:30:22Z
- **Completed:** 2026-03-05T08:35:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Product recommendations query matching Torke products by anchor type and diameter from the same product database used by e-commerce
- Cart integration passes calcReference through to order lines, enabling design-to-order traceability
- Auth gate modal preserves calculation state (design store in localStorage) during sign-up/sign-in flow
- Saved calculations page with load, delete, and new calculation actions

## Task Commits

Each task was committed atomically:

1. **Task 1: Product recommendations and cart integration** - `bb2e062` (feat)
2. **Task 2: Auth gate modal, action bar wiring, and saved calculations page** - `99c33a2` (feat)

## Files Created/Modified
- `src/components/design/ProductRecommendations.tsx` - Inline product cards matching calculation parameters, quantity pre-filled from group size
- `src/components/design/AuthGateModal.tsx` - Inline sign-up/login modal for save/export gating
- `src/app/(design)/design/saved/page.tsx` - Saved calculations list page with load/delete
- `src/components/design/ActionBar.tsx` - Wired export PDF, save, and view saved with auth checks
- `src/app/(design)/design/page.tsx` - Added ProductRecommendations below results panel
- `src/server/trpc/routers/orders.ts` - Added calcReference to order items input schema
- `src/server/services/order-service.ts` - Passes calcReference through to order line inserts

## Decisions Made
- Auth gate uses overlay modal (not redirect) to preserve localStorage-persisted design state
- Draft calcReference uses DESIGN-DRAFT-{timestamp} when calculation not yet saved
- Product diameter filter uses M-prefix format (M12, M16) matching product database

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 3 (Torke TRACE) is now complete with all 6 plans executed
- Design-to-order pipeline fully wired: calculate, recommend, add to cart, order with traceability
- Ready for Phase 4 or any additional phases

---
*Phase: 03-torke-design*
*Completed: 2026-03-05*
