# Project State

## Project Reference
See: .planning/PROJECT.md (updated 2026-03-04)
**Core value:** Full mill-to-site batch traceability with verifiable 3.1 certification
**Current focus:** Phase 2 — E-Commerce Order Flow + WMS

## Current Phase
Phase 2: E-Commerce Order Flow + WMS
Status: In Progress
Current Plan: 2 of 8

## Progress
Plan 02-00 (Test Infrastructure): COMPLETE
Plan 02-01 (Schema + Cart + Allocation): COMPLETE
Plan 02-02 (Stock Dashboard + Adjustments): PENDING
Plan 02-03 (Order Management): PENDING
Plan 02-04 (Fulfillment - Pick/Pack/Dispatch): PENDING
Plan 02-05 (Cert Pack + Invoice Generation): PENDING
Plan 02-06 (Email Notifications + Order History): PENDING
Plan 02-07 (Checkout + Payments): PENDING

## Completed Phases
Phase 1: Foundation + Catalogue + Traceability Core (4/4 plans)

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

## Performance Metrics

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 01 | 01 | 12min | 3 | 50+ |
| 01 | 02 | 13min | 3 | 11 |
| 01 | 03 | 15min | 4 | 23 |
| 01 | 04 | 20min | 5 | 37 |
| 02 | 00 | 3min | 2 | 14 |
| 02 | 01 | 7min | 4 | 16 |

## Last Session
- **Stopped at:** Completed 02-01-PLAN.md — Schema + Cart + Order Service
- **Timestamp:** 2026-03-04T23:19:59Z
