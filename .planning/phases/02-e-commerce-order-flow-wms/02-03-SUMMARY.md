---
phase: 02-e-commerce-order-flow-wms
plan: 03
subsystem: api
tags: [trpc, addresses, orders, price-validation, vat, credit-accounts]

requires:
  - phase: 02-e-commerce-order-flow-wms
    provides: "Schema (orders, addresses, credit-accounts, products), order-service, cart store"
provides:
  - "addressesRouter: CRUD + setDefault for delivery addresses"
  - "ordersRouter: create with server-side price validation, getById, confirmPayment, getCreditAccount, list"
  - "AddressForm component with UK postcode validation"
  - "AddressBook component with card layout, dialog editing, select mode"
  - "Account addresses page at /account/addresses"
affects: [02-03b-checkout-wizard, 02-04-fulfillment, 02-06-order-history]

tech-stack:
  added: []
  patterns: ["tRPC protectedProcedure for all customer endpoints", "warehouseProcedure for admin-only operations", "server-side price validation from products.pricePence"]

key-files:
  created:
    - src/server/trpc/routers/addresses.ts
    - src/server/trpc/routers/orders.ts
    - src/components/shop/AddressForm.tsx
    - src/components/shop/AddressBook.tsx
    - src/app/(shop)/account/addresses/page.tsx
  modified:
    - src/server/trpc/router.ts
    - src/__tests__/orders/orders.test.ts

key-decisions:
  - "Credit payment auto-confirms order and deducts from credit limit in same transaction"
  - "BACS orders go to awaiting_payment, warehouse staff confirms and triggers stock allocation"
  - "Card orders stay as draft until Stripe payment completes (handled by checkout wizard)"
  - "PO number required for credit payments only"
  - "AddressBook supports both management mode and select mode (for checkout)"

patterns-established:
  - "Address ownership verification: AND(id, userId) on all mutations"
  - "Server-side price validation: fetch pricePence from products table, never trust client"
  - "Credit limit pre-check before creating order"

requirements-completed: [SHOP-07, SHOP-08, SHOP-09, SHOP-11]

duration: 4min
completed: 2026-03-04
---

# Phase 02 Plan 03: Address Book & Orders Router Summary

**Address book CRUD with site contacts, orders tRPC router with server-side price validation from products.pricePence supporting card/credit/BACS payments**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-04T23:23:19Z
- **Completed:** 2026-03-04T23:27:40Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Address book with full CRUD, default address management, and site contact details
- Orders router fetches prices from products.pricePence (never trusts client-side prices)
- All three payment methods supported with appropriate status transitions
- 7 unit tests passing for price validation, VAT calculation, transitions, and error cases

## Task Commits

Each task was committed atomically:

1. **Task 1: Address book tRPC router and UI components** - `4636cf4` (feat)
2. **Task 2: Orders tRPC router with server-side price validation** - `0ebd36b` (feat)

## Files Created/Modified
- `src/server/trpc/routers/addresses.ts` - Address CRUD router (list, create, update, delete, setDefault)
- `src/server/trpc/routers/orders.ts` - Orders router (create, getById, getByIdAdmin, confirmPayment, getCreditAccount, list)
- `src/server/trpc/router.ts` - Wired addresses and orders routers
- `src/components/shop/AddressForm.tsx` - Reusable address form with UK postcode validation
- `src/components/shop/AddressBook.tsx` - Address card list with edit/delete/default actions and select mode
- `src/app/(shop)/account/addresses/page.tsx` - Account addresses management page
- `src/__tests__/orders/orders.test.ts` - 7 tests for price validation, transitions, errors

## Decisions Made
- Credit payment auto-confirms and deducts from credit limit in same DB transaction
- BACS orders move to awaiting_payment, admin confirms via confirmPayment mutation which triggers stock allocation
- Card orders remain as draft until Stripe webhook confirms payment (deferred to checkout wizard plan)
- PO number is required for credit payments, optional for card/BACS
- AddressBook component supports dual mode: management (edit/delete) and selection (for checkout)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added credit limit checking on credit orders**
- **Found during:** Task 2 (Orders router)
- **Issue:** Plan specified credit payment support but did not mention checking available credit limit before creating order
- **Fix:** Added pre-check that calculates order total and compares against (creditLimitPence - creditUsedPence)
- **Files modified:** src/server/trpc/routers/orders.ts
- **Verification:** TypeScript compiles, logic verified in code review
- **Committed in:** 0ebd36b (Task 2 commit)

**2. [Rule 2 - Missing Critical] Added orders.list endpoint for order history**
- **Found during:** Task 2 (Orders router)
- **Issue:** Plan specified getById and create but no way to list user's orders
- **Fix:** Added list query with pagination, ordered by createdAt DESC
- **Files modified:** src/server/trpc/routers/orders.ts
- **Committed in:** 0ebd36b (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 missing critical)
**Impact on plan:** Both additions necessary for correct operation. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required for this plan.

## Next Phase Readiness
- Address book and orders routers ready for checkout wizard UI (Plan 03b)
- Orders router API contracts established for fulfillment (Plan 04) and order history (Plan 06)
- Test stubs in checkout-flow.test.ts remain as todo for Plan 07

---
*Phase: 02-e-commerce-order-flow-wms*
*Completed: 2026-03-04*
