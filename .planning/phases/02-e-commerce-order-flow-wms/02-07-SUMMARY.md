---
phase: 02-e-commerce-order-flow-wms
plan: 07
subsystem: payments
tags: [stripe, checkout, bacs, credit-terms, next.js, trpc, zustand]

requires:
  - phase: 02-e-commerce-order-flow-wms
    provides: "Order schema, cart store, order service, address/order tRPC routers (Plans 01, 03)"
provides:
  - "3-step checkout wizard (address -> payment -> review)"
  - "Payment service with Stripe/credit/BACS handling"
  - "Stripe webhook for payment confirmation"
  - "Order success page with batch allocations and BACS bank details"
  - "Credit account admin (list/approve/reject)"
affects: [02-04-fulfillment, 02-05-cert-pack-invoice, 02-06-email-notifications]

tech-stack:
  added: [stripe, "@stripe/stripe-js"]
  patterns: [payment-strategy-pattern, stripe-webhook-signature-verification, idempotent-webhook-processing]

key-files:
  created:
    - src/app/(shop)/checkout/page.tsx
    - src/components/shop/CheckoutWizard.tsx
    - src/components/shop/CheckoutStep1Address.tsx
    - src/components/shop/CheckoutStep2Payment.tsx
    - src/components/shop/CheckoutStep3Review.tsx
    - src/server/services/payment-service.ts
    - src/app/api/stripe/webhook/route.ts
    - src/app/api/stripe/create-session/route.ts
    - src/app/(shop)/checkout/success/page.tsx
    - src/app/(wms)/credit-accounts/page.tsx
    - src/components/wms/CreditAccountManager.tsx
  modified:
    - src/server/trpc/routers/orders.ts
    - src/app/(wms)/layout.tsx
    - src/__tests__/checkout/checkout-flow.test.ts
    - src/__tests__/stripe/stripe-webhook.test.ts
    - src/__tests__/bacs/bacs-payment.test.ts

key-decisions:
  - "Stripe Checkout Sessions (hosted page) for SCA-compliant card payments"
  - "Payment service uses strategy pattern: card -> Stripe redirect, credit -> auto-confirm, BACS -> awaiting_payment"
  - "BACS success page IS the proforma with bank details inline (formal PDF proforma deferred to Plan 05)"
  - "Stripe webhook returns 200 even on business logic errors to prevent retry loops"
  - "Separate /api/stripe/create-session route for card payments (called after order creation)"

patterns-established:
  - "Payment strategy pattern: processPayment dispatches by method type"
  - "Idempotent webhook processing: check order status before transition"
  - "Stripe raw body handling: req.text() not req.json() for signature verification"

requirements-completed: [SHOP-08, SHOP-09, SHOP-10, TRACE-07]

duration: 9min
completed: 2026-03-04
---

# Phase 2 Plan 7: Checkout + Payments Summary

**3-step checkout wizard with Stripe/credit/BACS payment processing, webhook confirmation, success page with batch allocations, and credit account admin**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-04T23:31:53Z
- **Completed:** 2026-03-04T23:40:58Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments
- 3-step checkout wizard (address selection, payment method, order review) with step indicator
- Payment service handling all 3 methods: Stripe checkout sessions, credit account validation+deduction, BACS awaiting_payment
- Stripe webhook with signature verification, idempotent order confirmation, and FIFO stock allocation
- Success page showing order details with BACS bank details inline for bank transfer orders
- Credit account admin page for warehouse staff to approve/reject applications with credit limits and terms
- WMS sidebar updated with Orders and Credit Accounts navigation links
- 17 tests passing across checkout, Stripe webhook, and BACS test suites

## Task Commits

Each task was committed atomically:

1. **Task 1: Checkout wizard UI (3-step flow)** - `3c471a5` (feat)
2. **Task 2: Payment service, Stripe webhook, success page, credit admin** - `8ae5c3a` (feat)

## Files Created/Modified
- `src/app/(shop)/checkout/page.tsx` - Protected checkout page with cart-empty redirect
- `src/components/shop/CheckoutWizard.tsx` - 3-step wizard with state management and order creation
- `src/components/shop/CheckoutStep1Address.tsx` - Address selection via AddressBook select mode
- `src/components/shop/CheckoutStep2Payment.tsx` - Payment method selector with credit info display
- `src/components/shop/CheckoutStep3Review.tsx` - Order review with line items, VAT, totals
- `src/server/services/payment-service.ts` - Stripe session creation, credit validation, BACS handling
- `src/app/api/stripe/webhook/route.ts` - Stripe webhook with signature verification
- `src/app/api/stripe/create-session/route.ts` - Card payment session creation API
- `src/app/(shop)/checkout/success/page.tsx` - Success page with batch allocations and BACS bank details
- `src/app/(wms)/credit-accounts/page.tsx` - Admin credit account management page
- `src/components/wms/CreditAccountManager.tsx` - Credit account list with approve/reject actions
- `src/server/trpc/routers/orders.ts` - Added listCreditAccounts, approveCreditAccount, rejectCreditAccount mutations
- `src/app/(wms)/layout.tsx` - Added Orders and Credit Accounts sidebar links

## Decisions Made
- Stripe Checkout Sessions (hosted page) chosen for SCA compliance -- no custom card form needed
- Payment service strategy pattern: each method has its own transition logic
- BACS success page doubles as inline proforma (bank details shown directly); formal PDF proforma deferred to Plan 05
- Stripe webhook returns 200 even on business logic errors to prevent retry storms; orders can be manually reconciled
- Separate API route for Stripe session creation (called by checkout wizard after order creation via orders.create)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added Stripe create-session API route**
- **Found during:** Task 2 (Payment service)
- **Issue:** CheckoutWizard needs an API endpoint to create Stripe checkout sessions after order creation (the tRPC mutation creates the order, but Stripe session needs a separate call)
- **Fix:** Created src/app/api/stripe/create-session/route.ts with auth check and session creation
- **Files modified:** src/app/api/stripe/create-session/route.ts
- **Verification:** TypeScript compiles, route follows same pattern as webhook route
- **Committed in:** 8ae5c3a (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential for card payment flow. No scope creep.

## Issues Encountered
- BACS test initially failed due to import chain pulling in DATABASE_URL requirement -- resolved by mocking @/server/db module

## User Setup Required

**External services require manual configuration:**
- **Stripe:** STRIPE_SECRET_KEY (test mode sk_test_...), STRIPE_WEBHOOK_SECRET (from stripe listen CLI), NEXT_PUBLIC_APP_URL
- **Resend:** RESEND_API_KEY (for order confirmation emails, used by Plan 06)

## Next Phase Readiness
- Checkout and payment flow complete, ready for fulfillment (Plan 04) and invoice generation (Plan 05)
- Credit account admin enables warehouse staff to manage credit applications
- Order success page ready to display batch allocations once orders are confirmed and allocated

---
*Phase: 02-e-commerce-order-flow-wms*
*Completed: 2026-03-04*
