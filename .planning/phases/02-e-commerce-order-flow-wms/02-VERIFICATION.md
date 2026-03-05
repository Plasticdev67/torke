---
phase: 02-e-commerce-order-flow-wms
verified: 2026-03-05T00:45:00Z
status: passed
score: 20/20 requirements verified
re_verification:
  previous_status: gaps_found
  previous_score: 17/20
  gaps_closed:
    - "Dispatch mutation calls generateCertPack fire-and-forget (WMS-10 / TRACE-09) — commit 80cf6b0"
    - "Dispatch email now attaches cert pack because certPackKey is set before sendDispatchNotification fires (TRACE-10) — commit 80cf6b0"
    - "Checkout success page uses myOrderDetail and renders Torke Batch ID column per line (TRACE-07) — commit e69c0c7"
  gaps_remaining: []
  regressions: []
---

# Phase 02: E-Commerce Order Flow + WMS Verification Report

**Phase Goal:** Enable customers to buy products and Torke to fulfil orders with full batch traceability through the order lifecycle.
**Verified:** 2026-03-05T00:45:00Z
**Status:** PASSED
**Re-verification:** Yes — after gap closure plan 02-08

---

## Re-verification Summary

Plan 02-08 was executed specifically to close 3 blocking gaps found in the initial verification. All 3 gaps are confirmed closed by direct code inspection and git commit verification.

| Gap | Commits | Status |
|-----|---------|--------|
| `generateCertPack` not called on dispatch (WMS-10 / TRACE-09) | `80cf6b0` | CLOSED |
| Dispatch email missing cert pack attachment (TRACE-10) | `80cf6b0` (upstream fix) | CLOSED |
| Success page missing batch allocation column (TRACE-07) | `e69c0c7` | CLOSED |

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|---------|
| 1  | User can add product to basket and proceed to checkout | VERIFIED | AddToCartButton uses useCartStore().addItem; basket page renders BasketItems; "Proceed to Checkout" link present |
| 2  | Basket persists across page refreshes (localStorage) | VERIFIED | cart.ts uses zustand/persist with name "torke-cart" |
| 3  | All order-related database tables exist | VERIFIED | orders.ts, addresses.ts, credit-accounts.ts, invoices.ts, stock-adjustments.ts all present with correct schema |
| 4  | Products have price_pence column | VERIFIED | products.ts line 59: pricePence: integer("price_pence") |
| 5  | Order status state machine enforces valid transitions | VERIFIED | order-service.ts exports ORDER_TRANSITIONS, canTransition, transitionOrder |
| 6  | Orders router validates server-side prices from products.pricePence | VERIFIED | orders.ts line 94: fetches pricePence from products table before creating order |
| 7  | Customer can save/select delivery addresses with site contacts | VERIFIED | addresses router (list, create, update, delete, setDefault), AddressBook, AddressForm components |
| 8  | Checkout wizard supports all three payment methods | VERIFIED | CheckoutWizard with card/credit/BACS; payment-service.ts handles all 3; Stripe webhook wired |
| 9  | Stock dashboard shows product-level summaries with batch drill-down | VERIFIED | StockDashboard queries trpc.stock.dashboard; StockSummaryCards; batch expandable rows |
| 10 | Stock adjustments with reason codes update batch quantities | VERIFIED | StockAdjustmentForm calls trpc.stock.adjust; stock router has adjust mutation that updates batch quantityAvailable |
| 11 | Cert pack PDF generates with cover page and merged original certs | VERIFIED | certpack-service.ts is 529 lines, uses pdf-lib PDFDocument.create + copyPages, fetches certs from R2 |
| 12 | Invoice and proforma PDFs generate with batch references | VERIFIED | invoice-service.ts exports generateInvoice and generateProforma; Torke Batch ID column in invoice line items |
| 13 | Pick list shows FIFO-allocated batch IDs per line | VERIFIED | orders.getPickList joins allocations to batches; PickList component renders torkeBatchId per allocation row |
| 14 | Pick list is printable on A4 | VERIFIED | pick-print.css exists; PickList imports it; @media print styles present |
| 15 | Operator can confirm dispatch with parcel/pallet tracking info | VERIFIED | DispatchForm calls trpc.orders.dispatch; parcel/pallet conditional validation; tracking/consignment stored on order |
| 16 | Dispatch event triggers cert pack generation | VERIFIED | orders.ts line 19: `import { generateCertPack } from "@/server/services/certpack-service"`; lines 648-650: fire-and-forget call inside dispatch mutation; console.log placeholder fully removed (commit 80cf6b0) |
| 17 | Customer receives order confirmation email | VERIFIED | email-service.ts sendOrderConfirmation called fire-and-forget after orders.create (line 167) |
| 18 | Customer receives dispatch notification email with cert pack | VERIFIED | generateCertPack().then(() => sendDispatchNotification()) chain ensures certPackKey is set before email fires; email-service attachment logic at lines 243-295 attaches PDF when certPackKey present (commit 80cf6b0) |
| 19 | Customer can view order history with batch references per line | VERIFIED | OrderDetail uses myOrderDetail query which fetches allocations with torkeBatchId |
| 20 | Customer can re-order a previous order with one click | VERIFIED | OrderDetail.reorder fetches items via orders.reorder, adds to cart via useCartStore().addItem |
| 21 | Order confirmation (success page) shows batch allocation per line | VERIFIED | success/page.tsx now uses trpc.orders.myOrderDetail (lines 45-48); "Torke Batch ID" column rendered at line 152; torkeBatchId mapped at line 170; "Pending allocation" fallback at line 173 for card orders pre-webhook (commit e69c0c7) |

**Score:** 21/21 truths fully verified (was 17/21 — 3 failed, 1 partial)

---

## Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `src/server/db/schema/orders.ts` | VERIFIED | orderStatusEnum (10 values), paymentMethodEnum, orders + orderLines tables |
| `src/server/db/schema/addresses.ts` | VERIFIED | deliveryAddresses table with siteContactName/Phone |
| `src/server/db/schema/credit-accounts.ts` | VERIFIED | creditAccounts with creditTermsEnum and creditStatusEnum |
| `src/server/db/schema/invoices.ts` | VERIFIED | invoices table with pdfKey and relations |
| `src/server/db/schema/stock-adjustments.ts` | VERIFIED | adjustmentReasonEnum + stockAdjustments table |
| `src/server/db/schema/products.ts` | VERIFIED | pricePence: integer("price_pence") present |
| `src/stores/cart.ts` | VERIFIED | Zustand store with persist middleware; exports useCartStore |
| `src/app/(shop)/basket/page.tsx` | VERIFIED | Renders BasketItems; Proceed to Checkout link |
| `src/server/services/order-service.ts` | VERIFIED | Exports canTransition, transitionOrder, ORDER_TRANSITIONS, createOrder, allocateOrderStock |
| `src/server/trpc/routers/addresses.ts` | VERIFIED | list, create, update, delete, setDefault procedures |
| `src/server/trpc/routers/orders.ts` | VERIFIED | All procedures present; generateCertPack imported (line 19) and called fire-and-forget (lines 648-650) |
| `src/app/(shop)/account/addresses/page.tsx` | VERIFIED | Protected page rendering AddressBook |
| `src/components/shop/AddressForm.tsx` | VERIFIED | react-hook-form with UK postcode fields |
| `src/components/shop/AddressBook.tsx` | VERIFIED | Calls trpc.addresses.delete (and other CRUD mutations) |
| `src/app/(wms)/stock/page.tsx` | VERIFIED | Renders StockDashboard |
| `src/components/wms/StockDashboard.tsx` | VERIFIED | Queries trpc.stock.dashboard; expandable batch rows |
| `src/components/wms/StockAdjustmentForm.tsx` | VERIFIED | Calls trpc.stock.adjust mutation |
| `src/app/(wms)/stock/adjustments/page.tsx` | VERIFIED | Adjustment history log page |
| `src/server/services/certpack-service.ts` | VERIFIED | 529 lines, fully implemented; now called from dispatch mutation (no longer orphaned) |
| `src/server/services/invoice-service.ts` | VERIFIED | Exports generateInvoice, generateProforma; 600+ lines |
| `src/app/api/certpack/[orderId]/route.ts` | VERIFIED | GET handler calls generateCertPack on-demand |
| `src/app/api/invoice/[orderId]/route.ts` | VERIFIED | GET handler, ?type=proforma supported |
| `src/app/(shop)/checkout/page.tsx` | VERIFIED | Renders CheckoutWizard |
| `src/components/shop/CheckoutWizard.tsx` | VERIFIED | 3-step wizard; orders.create mutation; Stripe redirect |
| `src/server/services/payment-service.ts` | VERIFIED | createStripeCheckoutSession, validateCreditAccount, processPayment |
| `src/app/api/stripe/webhook/route.ts` | VERIFIED | Verifies signature; handles checkout.session.completed; transitions + allocates |
| `src/app/(shop)/checkout/success/page.tsx` | VERIFIED | Uses myOrderDetail (line 45); "Torke Batch ID" column (line 152); torkeBatchId rendered (line 170); "Pending allocation" fallback (line 173) |
| `src/app/(wms)/credit-accounts/page.tsx` | VERIFIED | Admin credit account management |
| `src/server/services/email-service.ts` | VERIFIED | Resend client; sendOrderConfirmation, sendDispatchNotification with cert pack attachment |
| `src/emails/order-confirmation.tsx` | VERIFIED | React Email template |
| `src/emails/dispatch-notification.tsx` | VERIFIED | React Email template with cert pack section |
| `src/app/(shop)/account/orders/page.tsx` | VERIFIED | Renders OrderHistory |
| `src/app/(shop)/account/orders/[id]/page.tsx` | VERIFIED | Renders OrderDetail |
| `src/app/(shop)/account/page.tsx` | VERIFIED | Renders AccountDashboard |
| `src/components/shop/OrderHistory.tsx` | VERIFIED | Calls trpc.orders.myOrders |
| `src/components/shop/OrderDetail.tsx` | VERIFIED | Calls myOrderDetail; shows torkeBatchId; reorder via useCartStore |
| `src/components/wms/PickList.tsx` | VERIFIED | Renders batch allocations per line; imports pick-print.css |
| `src/app/(wms)/orders/[id]/pick/page.tsx` | VERIFIED | Fetches pick list via trpc.orders.getPickList |
| `src/components/wms/DispatchForm.tsx` | VERIFIED | Calls trpc.orders.dispatch; parcel/pallet conditional fields |
| `src/styles/pick-print.css` | VERIFIED | @media print styles for A4 pick list |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `AddToCartButton.tsx` | `cart.ts` | useCartStore().addItem | WIRED | Line 25-28 |
| `BasketItems.tsx` | `cart.ts` | useCartStore().items | WIRED | Lines 12-15 |
| `order-service.ts` | `products.ts` | pricePence fetch | WIRED | createOrder fetches pricePence at lines 165-177 |
| `AddressBook.tsx` | `addresses router` | trpc.addresses.delete | WIRED | Line 50 |
| `StockAdjustmentForm.tsx` | `stock router` | trpc.stock.adjust | WIRED | Line 54 |
| `StockDashboard.tsx` | `stock router` | trpc.stock.dashboard | WIRED | Line 110 |
| `orders.ts router` | `order-service.ts` | createOrder | WIRED | Lines 132, 14 |
| `orders.ts router` | `email-service.ts` | sendOrderConfirmation / sendDispatchNotification | WIRED | Lines 167, 649 |
| `orders.ts router` | `certpack-service.ts` | generateCertPack fire-and-forget | WIRED | Line 19 import; lines 648-650 call |
| `certpack-service.ts` | `storage.ts` | downloadFile (GetObjectCommand) | WIRED | Line 8 import; line 445 |
| `certpack-service.ts` | `pdf-lib` | PDFDocument.copyPages for merging | WIRED | Line 502 |
| `invoice-service.ts` | `pdf-lib` | PDFDocument.create | WIRED | Lines 533, 604 |
| `email-service.ts` | `resend` | resend.emails.send | WIRED | Lines 17, 185, 273 |
| `email-service.ts` | `certpack-service.ts` | cert pack attached when certPackKey set | WIRED | certPackKey is now set by generateCertPack before sendDispatchNotification fires (commit 80cf6b0) |
| `DispatchForm.tsx` | `orders router` | trpc.orders.dispatch | WIRED | Line 60 |
| `DispatchForm.tsx` | `certpack-service.ts` | dispatch triggers generateCertPack | WIRED | generateCertPack().then(sendDispatchNotification) at orders.ts lines 648-650 |
| `PickList.tsx` | `orders router` | orders.getPickList | WIRED | pick/page.tsx line 13 |
| `OrderHistory.tsx` | `orders router` | orders.myOrders | WIRED | Line 51 |
| `OrderDetail.tsx` | `cart.ts` | useCartStore().addItem for reorder | WIRED | Line 41 |
| `webhook/route.ts` | `order-service.ts` | transitionOrder on payment_intent.succeeded | WIRED | Lines 5, 92 |
| `success/page.tsx` | `orders router` | myOrderDetail with allocations | WIRED | Line 45; torkeBatchId rendered at line 170 |

---

## Requirements Coverage

| Requirement | Plans | Description | Status | Evidence |
|-------------|-------|-------------|--------|---------|
| SHOP-06 | 01 | User can add products to basket and proceed to checkout | SATISFIED | AddToCartButton + cart store + basket page |
| SHOP-07 | 03 | PO number at checkout | SATISFIED | orders.create requires poNumber for credit; optional otherwise |
| SHOP-08 | 03, 07 | Credit terms checkout | SATISFIED | validateCreditAccount + credit flow in orders.create |
| SHOP-09 | 03, 05, 07 | BACS bank transfer | SATISFIED | BACS path in orders.create; proforma invoice; success page bank details |
| SHOP-10 | 07 | Stripe card payment with SCA | SATISFIED | createStripeCheckoutSession uses Stripe-hosted checkout (SCA compliant); webhook confirms |
| SHOP-11 | 03 | Multiple saved delivery addresses | SATISFIED | addresses router with full CRUD; site contact fields |
| SHOP-12 | 06 | Order confirmation email | SATISFIED | sendOrderConfirmation wired into orders.create (line 167) |
| SHOP-14 | 06 | Order history with batch references per line | SATISFIED | myOrderDetail fetches allocations; OrderDetail renders torkeBatchId |
| SHOP-15 | 06 | One-click reorder | SATISFIED | orders.reorder query + OrderDetail adds items to cart |
| SHOP-16 | 05, 06 | Download invoices from account portal | SATISFIED | OrderDetail links to /api/invoice/[orderId]; generateInvoice implemented |
| TRACE-07 | 07, 08 | Order confirmation shows batch allocation per line | SATISFIED | success/page.tsx uses myOrderDetail; "Torke Batch ID" column renders torkeBatchId per line; "Pending allocation" for unallocated orders (commit e69c0c7) |
| TRACE-09 | 05, 08 | Cert pack auto-generates on dispatch | SATISFIED | generateCertPack imported (orders.ts line 19) and called fire-and-forget (lines 648-650) after dispatch transaction; console.log placeholder removed (commit 80cf6b0) |
| TRACE-10 | 06, 08 | Cert pack emailed with dispatch notification | SATISFIED | generateCertPack chained before sendDispatchNotification via .then(); certPackKey set before email fires; email-service attachment logic at lines 243-295 attaches PDF (commit 80cf6b0) |
| TRACE-11 | 05 | Cert pack includes Torke batch ID, supplier batch, manufacturer, heat number | SATISFIED | certpack-service.ts TraceabilityRow interface has all required columns; cover page table implemented |
| WMS-02 | 04 | FIFO at allocation — pick lists show oldest batch | SATISFIED | allocateOrderStock calls allocateFIFO; getPickList joins allocations ordered correctly |
| WMS-03 | 02 | Stock dashboard by product and batch | SATISFIED | trpc.stock.dashboard returns product-level aggregates; StockDashboard renders with batch drill-down |
| WMS-04 | 01, 02 | Stock adjustments with reason codes | SATISFIED | adjustmentReasonEnum + stockAdjustments table; trpc.stock.adjust mutation |
| WMS-08 | 04 | Pick lists from confirmed orders with FIFO batch allocation | SATISFIED | orders.getPickList fetches allocations; PickList renders torkeBatchId per line |
| WMS-09 | 04 | Parcel and pallet dispatch workflows | SATISFIED | DispatchForm parcel/pallet toggle; tracking/consignment required per type |
| WMS-10 | 04, 08 | Dispatch triggers cert pack generation | SATISFIED | generateCertPack called fire-and-forget from dispatch mutation (commit 80cf6b0); no placeholder remains |

**Requirements: 20/20 SATISFIED (previously 17 SATISFIED / 3 BLOCKED / 1 PARTIAL)**

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/server/services/invoice-service.ts` | 29 | `// TODO: Replace with real VAT number` | INFO | Production concern only — does not block functionality |

The two BLOCKER anti-patterns from the initial verification (`console.log` placeholder in orders.ts dispatch mutation and the missing batch allocation column in success/page.tsx) are both resolved.

---

## Human Verification Required

### 1. Stripe SCA Payment Flow

**Test:** Add items to basket, proceed to checkout, select card payment, place order. Verify redirect to Stripe-hosted checkout page (not an embedded form). Complete with test card 4242424242424242.
**Expected:** Order transitions to awaiting_payment, Stripe webhook fires, order transitions to confirmed and then allocated. After allocation, revisiting the success page should show the Torke Batch ID column populated.
**Why human:** Requires live Stripe test keys and cannot be verified programmatically.

### 2. Dispatch Cert Pack Email Attachment

**Test:** Create an order, pick it, pack it, then dispatch it via DispatchForm. Verify the dispatch notification email is received with a cert pack PDF attachment (or download link if >10MB).
**Expected:** Email arrives with cert pack attached. If cert pack generation fails (e.g., no source certs in R2), email arrives without attachment but dispatch is not blocked.
**Why human:** Requires a real order with real batch certs in R2; email rendering requires visual inspection.

### 3. BACS Proforma Invoice Display

**Test:** Place a BACS order. Verify the success page shows bank account details (account name, sort code, account number, order reference).
**Expected:** Bank details prominently displayed with correct payment reference (order number).
**Why human:** Requires end-to-end checkout flow with BACS payment method.

### 4. Print Pick List

**Test:** Create a pick-list-ready order and navigate to the pick list page. Use browser print (Ctrl+P).
**Expected:** A4 output showing only the pick list (nav/sidebar hidden), black on white, table borders visible, checkboxes present.
**Why human:** Print CSS cannot be verified without a browser rendering engine.

---

## Verification Narrative

Phase 02 is complete. All 20 requirement IDs are satisfied.

**Gap closure confirmed:** Plan 02-08 made exactly two targeted changes, both verified against the actual codebase:

1. `src/server/trpc/routers/orders.ts` (commit `80cf6b0`): The `console.log` placeholder at the former lines 639-643 is completely gone. `generateCertPack` is imported at line 19 and called fire-and-forget at lines 648-650 using a `.then()` chain that ensures `sendDispatchNotification` fires only after `certPackKey` is set on the order. This simultaneously closes WMS-10 (cert pack generation) and TRACE-10 (cert pack in dispatch email).

2. `src/app/(shop)/checkout/success/page.tsx` (commit `e69c0c7`): The page now uses a two-step query pattern — `trpc.orders.list` to locate the order by `orderNumber`, then `trpc.orders.myOrderDetail` (enabled once the ID is known) to fetch full allocation data. The table header includes "Torke Batch ID" and each row renders `torkeBatchId` values joined by comma, falling back to "Pending allocation" in italic for card orders that have not yet been allocated via the Stripe webhook. This closes TRACE-07.

The phase goal — "Enable customers to buy products and Torke to fulfil orders with full batch traceability through the order lifecycle" — is fully achieved.

---

_Verified: 2026-03-05T00:45:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification after plan 02-08 gap closure_
