---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_plan: 0 of 6
status: planned
stopped_at: Phase 3 planned — ready for execution
last_updated: "2026-03-05T01:15:00.000Z"
progress:
  total_phases: 4
  completed_phases: 2
  total_plans: 19
  completed_plans: 13
---

# Project State

## Project Reference
See: .planning/PROJECT.md (updated 2026-03-04)
**Core value:** Full mill-to-site batch traceability with verifiable 3.1 certification
**Current focus:** Phase 3 — Torke Design

## Current Phase
Phase 3: Torke Design
Status: Planned (6 plans, 4 waves)
Current Plan: 0 of 6

## Progress
Plan 02-00 (Test Infrastructure): COMPLETE
Plan 02-01 (Schema + Cart + Allocation): COMPLETE
Plan 02-02 (Stock Dashboard + Adjustments): COMPLETE
Plan 02-03 (Order Management): COMPLETE
Plan 02-04 (Fulfillment - Pick/Pack/Dispatch): COMPLETE
Plan 02-05 (Cert Pack + Invoice Generation): COMPLETE
Plan 02-06 (Email Notifications + Order History): COMPLETE
Plan 02-07 (Checkout + Payments): COMPLETE
Plan 02-08 (Gap Closure - Traceability Wiring): COMPLETE

## Completed Phases
Phase 1: Foundation + Catalogue + Traceability Core (4/4 plans)
Phase 2: E-Commerce Order Flow + WMS (8/8 plans)

## Decisions
- pricePence nullable on products: products without prices show "Contact for pricing" and cannot be ordered
- Cart stores client-side prices for display only; server re-validates from products.pricePence at order creation
- Order number format ORD-YYYYMM-NNNNNN with MAX-query-in-transaction for sequence generation
- Cancelled transitions blocked from dispatched/delivered (goods already shipped)
- AddToCartButton replaces Request Quote on product pages when price is available
- Vitest globals enabled; explicit imports in stubs for IDE support
- Node test environment (not jsdom) for server-side Phase 2 logic
- R2 storage mocked globally in test setup for all test files
- Used Next.js 16.1.6 (latest stable); middleware deprecated but functional for auth checks
- Drizzle schema split by domain: products, batches, stock, verification, allocations, users
- Better Auth 1.5.3 requires separate @better-auth/drizzle-adapter package
- Dark theme as default (not media query based) per Torke brand requirements
- sonner used instead of deprecated shadcn toast component
- Inter font as primary typeface for professional B2B aesthetic
- Mapped 6 Proventure categories to 3 Torke top-level (chemical/mechanical/general) with 6 subcategories
- Scraped product families (not individual SKUs) since Proventure site uses family pages
- Generated Torke SKUs as TRK-{TYPE}-{SHORTCODE} for families; variant expansion deferred
- Downloaded 51MB of binary assets locally; excluded from git via .gitignore
- Product listing uses dual data source: Meilisearch for facets/search, DB fallback when unavailable
- Product detail pages use force-dynamic to avoid build-time DB queries
- Filter state stored in URL search params for shareable/bookmarkable filtered views
- Batch creation and verification token generation in single DB transaction for atomicity
- QR verification URLs use /t/{uuid} permanent scheme — opaque tokens, not batch IDs
- FIFO allocation queries batches ordered by goodsInDate ASC, splits across batches if needed
- Label print CSS uses @page 100mm x 60mm for thermal label stock
- Verification page uses light theme (exception to site dark theme) for certificate-like trustworthiness
- Mill cert fields optional on goods-in form for Phase 2 readiness
- Credit payment auto-confirms order and deducts from credit limit in same transaction
- BACS orders go to awaiting_payment, warehouse staff confirms and triggers stock allocation
- Card orders stay as draft until Stripe payment completes (handled by checkout wizard)
- PO number required for credit payments only
- AddressBook supports both management mode and select mode (for checkout)
- Stock adjustments are immediate with no approval workflow -- all logged for audit trail
- Low stock threshold < 10 units per product for dashboard summary card
- Batch status auto-transitions to depleted when quantityAvailable reaches zero via adjustment
- pdf-lib used for all PDF generation (zero native deps, works in Edge/Node)
- Cert page references pre-calculated using dual-pass approach
- Proforma invoices have no invoice number (not a tax document per HMRC)
- Bank details sourced from env vars with placeholder defaults for development
- Invoice and proforma share layout helpers to avoid duplication
- Stripe Checkout Sessions (hosted page) for SCA-compliant card payments
- Payment service strategy pattern: card -> Stripe redirect, credit -> auto-confirm, BACS -> awaiting_payment
- BACS success page doubles as inline proforma with bank details; formal PDF deferred to Plan 05
- Stripe webhook returns 200 even on business logic errors to prevent retry loops
- Separate API route for Stripe session creation after order creation
- Dispatch Zod validation uses .refine() for conditional required fields (tracking/consignment)
- Pick list uses A4 print stylesheet with picklist-container class visibility pattern
- Cert pack generation wired into dispatch mutation via fire-and-forget promise chain (replaced console.log placeholder)
- Fire-and-forget email pattern: email calls use .catch(console.error) so order mutations never fail due to email
- Cert pack attached to dispatch email if <10MB, presigned R2 URL if larger (7 day expiry)
- Reorder fetches current product prices, not historical order prices
- Account summary excludes draft and cancelled orders from spending totals
- generateCertPack chained before sendDispatchNotification via .then() so email can attach cert pack PDF
- Checkout success page uses myOrderDetail query for batch allocation data with 'in' operator type guard

## Performance Metrics

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 01 | 01 | 12min | 3 | 50+ |
| 01 | 02 | 13min | 3 | 11 |
| 01 | 03 | 15min | 4 | 23 |
| 01 | 04 | 20min | 5 | 37 |
| 02 | 00 | 3min | 2 | 14 |
| 02 | 01 | 7min | 4 | 16 |
| 02 | 02 | 5min | 2 | 7 |
| 02 | 03 | 4min | 2 | 7 |
| 02 | 05 | 7min | 2 | 7 |
| 02 | 07 | 9min | 2 | 17 |
| 02 | 04 | 7min | 2 | 11 |
| 02 | 06 | 9min | 2 | 15 |
| 02 | 08 | 4min | 2 | 2 |

## Last Session
- **Stopped at:** Phase 3 planned — ready for execution
- **Timestamp:** 2026-03-05T01:15:00Z
