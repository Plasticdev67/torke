---
phase: 02-e-commerce-order-flow-wms
plan: 06
subsystem: api, ui, email
tags: [resend, react-email, trpc, zustand, account-portal, order-history, email-notifications, cert-pack]

requires:
  - phase: 02-e-commerce-order-flow-wms
    provides: "Order schema, cart store, orders router, certpack-service, invoice-service, fulfillment dispatch"
provides:
  - "Email service with Resend (sendOrderConfirmation, sendDispatchNotification)"
  - "Order confirmation and dispatch notification email templates"
  - "Customer account dashboard with spending summary"
  - "Order history and order detail pages with batch refs"
  - "Reorder functionality (adds past order items to cart)"
  - "Invoice, proforma, cert pack download buttons on order detail"
  - "myOrders, myOrderDetail, reorder, accountSummary tRPC procedures"
affects: [customer-facing, order-lifecycle, traceability-delivery]

tech-stack:
  added: [resend, "@react-email/components"]
  patterns: ["fire-and-forget email sending with .catch(console.error)", "cert pack attachment size threshold (10MB)", "account portal with spending aggregates"]

key-files:
  created:
    - src/server/services/email-service.ts
    - src/emails/order-confirmation.tsx
    - src/emails/dispatch-notification.tsx
    - src/components/shop/AccountDashboard.tsx
    - src/components/shop/OrderHistory.tsx
    - src/components/shop/OrderDetail.tsx
    - src/app/(shop)/account/page.tsx
    - src/app/(shop)/account/orders/page.tsx
    - src/app/(shop)/account/orders/[id]/page.tsx
  modified:
    - src/server/trpc/routers/orders.ts
    - src/__tests__/email/email-service.test.ts
    - src/__tests__/orders/orders.test.ts

key-decisions:
  - "Fire-and-forget pattern for emails: email failure never blocks order/dispatch mutations"
  - "Cert pack attached to dispatch email if <10MB, presigned URL if larger"
  - "Reorder returns items at current prices (not historical), user adjusts in basket before checkout"
  - "Account summary excludes draft and cancelled orders from spending totals"

patterns-established:
  - "Fire-and-forget email: sendX(orderId).catch(console.error) after mutation completes"
  - "React Email templates with inline styles and Torke brand red accent"
  - "Account portal tab navigation pattern: Dashboard / Orders / Addresses"

requirements-completed: [SHOP-12, SHOP-14, SHOP-15, TRACE-10]

duration: 9min
completed: 2026-03-05
---

# Phase 2 Plan 6: Email Notifications + Customer Account Portal Summary

**Resend email service with order confirmation and dispatch notification (cert pack attached/linked), plus customer account portal with order history, batch refs, reorder, and document downloads**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-04T23:54:13Z
- **Completed:** 2026-03-05T00:03:30Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments
- Email service via Resend: order confirmation (SHOP-12) and dispatch notification with cert pack (TRACE-10)
- Customer account dashboard with spending summary, top products, credit account status
- Order history as card-based list with status badges, line preview, pagination
- Order detail showing batch allocations per line (SHOP-14), tracking info, download buttons
- One-click reorder adds items to cart at current prices (SHOP-15)
- Invoice, proforma, and cert pack downloads from order detail

## Task Commits

Each task was committed atomically:

1. **Task 1: Email service, templates, and wiring into orders router** - `285d69a` (feat)
2. **Task 2: Customer account portal with order history, reorder, and downloads** - `d998f62` (feat)

## Files Created/Modified
- `src/server/services/email-service.ts` - Email dispatch via Resend with cert pack attachment logic
- `src/emails/order-confirmation.tsx` - Order confirmation React Email template
- `src/emails/dispatch-notification.tsx` - Dispatch notification React Email template with tracking and cert pack
- `src/server/trpc/routers/orders.ts` - Added email wiring + myOrders, myOrderDetail, reorder, accountSummary
- `src/components/shop/AccountDashboard.tsx` - Spending summary dashboard component
- `src/components/shop/OrderHistory.tsx` - Card-based order history with status badges
- `src/components/shop/OrderDetail.tsx` - Full order detail with batch refs, tracking, downloads, reorder
- `src/app/(shop)/account/page.tsx` - Account dashboard page with tab navigation
- `src/app/(shop)/account/orders/page.tsx` - Order history page
- `src/app/(shop)/account/orders/[id]/page.tsx` - Order detail page
- `src/__tests__/email/email-service.test.ts` - 5 email service tests
- `src/__tests__/orders/orders.test.ts` - Added 4 account portal test stubs

## Decisions Made
- Fire-and-forget email pattern: email calls use `.catch(console.error)` so order/dispatch mutations never fail due to email issues
- Cert pack attachment threshold at 10MB: below attaches directly, above generates presigned R2 URL valid 7 days
- Reorder fetches current product prices (not historical order prices) so pricing is always up-to-date
- Account summary excludes draft and cancelled orders from spending calculations
- Used `vi.hoisted()` for Vitest mock setup to handle factory hoisting correctly

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Vitest mock hoisting required `vi.hoisted()` for the Resend mock factory (resolved on second attempt)

## User Setup Required

Environment variables needed for email functionality:
- `RESEND_API_KEY` - Resend API key for sending emails
- `RESEND_FROM_EMAIL` - Optional, defaults to "Torke <orders@torke.co.uk>"

## Next Phase Readiness
- All Phase 2 plans complete (02-00 through 02-07)
- Full e-commerce order flow operational: cart -> checkout -> payment -> fulfillment -> dispatch -> email -> account portal
- Email notifications and account portal provide the customer-facing completion of the order lifecycle

## Self-Check: PASSED

All 9 created files verified present. Both task commits (285d69a, d998f62) verified in git log.

---
*Phase: 02-e-commerce-order-flow-wms*
*Completed: 2026-03-05*
