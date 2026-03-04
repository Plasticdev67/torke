---
phase: 02-e-commerce-order-flow-wms
plan: 01
subsystem: database, api, ui
tags: [drizzle, zustand, trpc, orders, cart, state-machine, postgresql]

requires:
  - phase: 01-foundation
    provides: products schema, batches schema, allocations, batch-service FIFO logic

provides:
  - orders and order_lines database tables with status enum
  - delivery_addresses, credit_accounts, invoices, stock_adjustments tables
  - pricePence column on products table
  - Zustand cart store with localStorage persistence
  - Basket page with quantity controls and checkout link
  - AddToCartButton component for product pages
  - Order service with status state machine (10 states)
  - createOrder with server-side price validation
  - allocateOrderStock wiring FIFO allocation to orders
  - WMS setPrice and bulkSetPrices tRPC mutations

affects: [02-02, 02-03, 02-04, 02-05, 02-06]

tech-stack:
  added: []
  patterns: [order-status-state-machine, zustand-persist-cart, server-side-price-validation]

key-files:
  created:
    - src/server/db/schema/orders.ts
    - src/server/db/schema/addresses.ts
    - src/server/db/schema/credit-accounts.ts
    - src/server/db/schema/invoices.ts
    - src/server/db/schema/stock-adjustments.ts
    - src/stores/cart.ts
    - src/components/shop/CartProvider.tsx
    - src/components/shop/AddToCartButton.tsx
    - src/components/shop/BasketItems.tsx
    - src/app/(shop)/basket/page.tsx
    - src/server/services/order-service.ts
  modified:
    - src/server/db/schema/index.ts
    - src/server/db/schema/allocations.ts
    - src/server/db/schema/products.ts
    - src/server/trpc/routers/products.ts
    - src/app/(shop)/products/[slug]/page.tsx
    - src/__tests__/cart/cart-store.test.ts
    - src/__tests__/allocation/fifo-allocation.test.ts

key-decisions:
  - "pricePence is nullable on products -- products without prices show 'Contact for pricing' and cannot be ordered"
  - "Cart stores client-side prices for display only; server re-validates from products.pricePence at order creation"
  - "Order number format ORD-YYYYMM-NNNNNN with MAX-query-in-transaction for sequence generation"
  - "Cancelled orders can come from most statuses except dispatched/delivered (goods already shipped)"
  - "AddToCartButton replaces Request Quote button on product pages when price is available"

patterns-established:
  - "Order status state machine: ORDER_TRANSITIONS map + canTransition() guard + transitionOrder() with timestamp updates"
  - "Zustand persist pattern: create store with persist middleware, wrap in CartProvider for SSR hydration safety"
  - "Server-side price validation: createOrder always fetches from products.pricePence, never trusts client data"

requirements-completed: [SHOP-06, WMS-04]

duration: 7min
completed: 2026-03-04
---

# Phase 2 Plan 01: Data Foundation Summary

**Order/cart data foundation with 5 new DB schemas, Zustand cart store with localStorage persistence, order status state machine covering 10 states, and WMS price management mutations**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-04T23:12:51Z
- **Completed:** 2026-03-04T23:19:59Z
- **Tasks:** 4
- **Files modified:** 16

## Accomplishments
- All 5 Phase 2 database schemas created (orders, addresses, credit accounts, invoices, stock adjustments)
- Zustand cart store with localStorage persistence and full test coverage (11 tests)
- Order service state machine with 10 statuses, validated transitions, and 20 tests
- WMS price mutations (setPrice, bulkSetPrices) and product page price display with AddToCartButton

## Task Commits

Each task was committed atomically:

1. **Task 1: Create all Phase 2 database schemas** - `adc9325` (feat)
2. **Task 2: Create Zustand cart store, basket page, and AddToCartButton** - `e1d2c82` (feat)
3. **Task 3: Create order service with status state machine** - `e7bf3b3` (feat)
4. **Task 4: Add WMS price mutations and product page price display** - `47aeae6` (feat)

## Files Created/Modified
- `src/server/db/schema/orders.ts` - Orders and order_lines tables with status/payment enums
- `src/server/db/schema/addresses.ts` - Delivery addresses with site contact fields
- `src/server/db/schema/credit-accounts.ts` - Credit accounts with terms and status enums
- `src/server/db/schema/invoices.ts` - Invoices linked to orders
- `src/server/db/schema/stock-adjustments.ts` - Stock adjustments with reason enum
- `src/server/db/schema/index.ts` - Re-exports all new schemas
- `src/server/db/schema/allocations.ts` - Added FK to orderLines and relation
- `src/server/db/schema/products.ts` - Added pricePence column
- `src/stores/cart.ts` - Zustand cart store with persist middleware
- `src/components/shop/CartProvider.tsx` - SSR hydration wrapper
- `src/components/shop/AddToCartButton.tsx` - Add to basket with quantity selector
- `src/components/shop/BasketItems.tsx` - Basket item list with controls
- `src/app/(shop)/basket/page.tsx` - Basket page with checkout link
- `src/server/services/order-service.ts` - Order status machine, create, allocate
- `src/server/trpc/routers/products.ts` - setPrice/bulkSetPrices mutations
- `src/app/(shop)/products/[slug]/page.tsx` - Price display and AddToCartButton integration

## Decisions Made
- pricePence nullable on products: products without prices cannot be ordered but remain visible in catalogue
- Cart client-side prices are display-only; createOrder always fetches from DB
- Order numbers use ORD-YYYYMM-NNNNNN format with transactional sequence generation
- Cancelled transitions blocked from dispatched/delivered (goods already shipped)
- AddToCartButton replaces Request Quote when a product has a price set

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added pricePence to products in Task 3 instead of Task 4**
- **Found during:** Task 3 (Order service creation)
- **Issue:** order-service.ts references products.pricePence which didn't exist yet (Task 4 deliverable)
- **Fix:** Added pricePence column to products.ts during Task 3 commit to unblock compilation
- **Files modified:** src/server/db/schema/products.ts
- **Verification:** TypeScript compiles, order service references pricePence correctly
- **Committed in:** e7bf3b3 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor reordering -- pricePence column moved from Task 4 to Task 3 to resolve compilation dependency. Task 4 still added the WMS mutations and product page display as planned.

## Issues Encountered
- Allocation tests failed initially due to DATABASE_URL requirement from batch-service.ts import chain -- resolved by mocking @/server/db and @/server/services/batch-service modules

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All Phase 2 schemas in place for Plans 02-06
- Cart store ready for checkout flow (Plan 03)
- Order service ready for checkout mutations and WMS order management
- Price mutations ready for WMS operators to set prices before products can be ordered
- Allocations schema updated with FK to orderLines for full traceability

---
*Phase: 02-e-commerce-order-flow-wms*
*Completed: 2026-03-04*
