---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_plan: 5 of 6
status: executing
stopped_at: Completed 04-05-PLAN.md
last_updated: "2026-03-05T10:32:19.331Z"
progress:
  total_phases: 4
  completed_phases: 4
  total_plans: 25
  completed_plans: 25
---

# Project State

## Project Reference
See: .planning/PROJECT.md (updated 2026-03-04)
**Core value:** Full mill-to-site batch traceability with verifiable 3.1 certification
**Current focus:** Phase 4 — Portals, Marketing & Polish

## Current Phase
Phase 4: Portals, Marketing & Polish
Status: In Progress (6 plans, 3 waves)
Current Plan: 5 of 6

## Progress
Plan 04-04 (Resource Library + Technical Glossary): COMPLETE
Plan 04-05 (Lead Generation Funnel): COMPLETE
Plan 04-03 (Blog + SEO Schema Markup): COMPLETE
Plan 04-02 (...): COMPLETE
Plan 04-01 (...): COMPLETE
Plan 04-00 (Test Infrastructure): COMPLETE
Plan 03-06 (Design-to-Order Pipeline + Auth Gate): COMPLETE
Plan 03-05 (PDF Report + Calculations Router): COMPLETE
Plan 03-04 (Results Display + Action Bar): COMPLETE
Plan 03-03 (3D Anchor Visualisation): COMPLETE
Plan 03-02 (Design Input Surface): COMPLETE
Plan 03-01 (EN 1992-4 Calc Engine): COMPLETE
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
Phase 3: Torke TRACE (6/6 plans)

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
- All Torke products treated as post-installed anchors (k1 = 7.7 cracked / 11.0 uncracked)
- Pull-out for mechanical anchors uses Infinity resistance (governed by cone breakout)
- Splitting uses generic hmin = max(2*hef, 100mm) with scope limitation disclaimer
- Combined interaction checks both steel (exponent 2) and concrete (exponent 1.5) separately
- Governing mode determined across all 7 modes + combined (can be Combined Interaction)
- Project info fields (projectName, engineerName, etc.) added to DesignInputs for PDF reports
- Cart items with different calcReference treated as separate line items (not merged)
- 5 design presets: Single M12, Single M16, 4-Bolt M12, 4-Bolt M20, Blank Slate
- CollapsibleSection + FieldGroup reusable components for design tool UI pattern
- mm-to-metres conversion (/ 1000) as standard R3F scene unit scale
- React.memo + granular Zustand selectors on all 3D components to avoid R3F re-render storms
- Dynamic import with ssr:false for AnchorScene (R3F requires browser WebGL APIs)
- Mobile screens get fallback message instead of 3D scene (WebGL performance + screen space)
- FailureCone uses CCD method 1.5*hef radius for cone breakout geometry
- Debounced recalculation (300ms) wired directly in design page useEffect
- Multiple failure mode bars can be expanded simultaneously via Set<number> state
- Action bar buttons are stubs pending auth gate integration in Plan 06
- PDF report uses PageState mutable object pattern for multi-page flow control
- Scope limitations footer on every page (5.5pt font to fit single line)
- Presigned R2 download URLs with 24h expiry for PDF exports
- CALC-YYYY-NNNNNN reference generation reuses MAX-query-in-transaction pattern

- Auth gate uses overlay modal (not redirect) to preserve localStorage-persisted design state
- Draft calcReference uses DESIGN-DRAFT-{timestamp} when calculation not yet saved
- Product diameter filter uses M-prefix format (M12, M16) matching product database
- Phase 4 test stubs follow Phase 2 precedent: explicit vitest imports for IDE support
- Tab navigation added consistently to all account pages (dashboard, orders, addresses, certifications)
- Cert search queries through orders -> orderLines -> allocations -> batches -> products with conditional ILIKE filters
- Bulk ZIP uses Promise.allSettled for resilient parallel R2 fetches with partial success
- Blog content files in /content/blog/ outside app dir, loaded via gray-matter + dynamic import
- Blog route group (blog) uses separate layout from shop for simpler content-focused nav
- Client-side category filter sufficient for small post count
- mdx-components.tsx required at root for @next/mdx App Router integration
- JSON-LD structured data via schema-dts typed helpers + generic JsonLd component
- SoftPrompt uses localStorage counter + custom event dispatch for decoupled component communication
- Company field added to AuthGateModal alongside existing /register page for complete lead capture
- Admin leads query uses raw SQL joins across user, calculations, orders, and user_profiles tables
- Leads page at /leads in WMS layout matching existing flat nav pattern
- ResourceFilter as client component for category/search filtering with server-fetched product data
- Glossary terms imported via relative path from content/glossary.json (outside src/)
- FAQ schema maps each glossary term to "What is [term]?" question format for featured snippets
- PDF template extracted header/footer pattern from certpack-service into reusable utility
- [Phase 04]: Share token QR codes generated inline via qrcode library (same as batch QR service)
- [Phase 04]: Order verification /v/[token] uses light theme with red header; mobile-responsive cards for on-site viewing
- [Phase 04]: Fire-and-forget lastAccessedAt update on share token access to avoid blocking render

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
| 03 | 01 | 8min | 2 | 19 |
| 03 | 02 | 10min | 2 | 18 |
| 03 | 03 | 4min | 2 | 9 |
| 03 | 04 | 3min | 2 | 6 |
| 03 | 05 | 6min | 2 | 4 |
| 03 | 06 | 5min | 2 | 7 |
| 04 | 00 | 1min | 1 | 9 |
| 04 | 01 | 6min | 2 | 14 |
| 04 | 03 | 6min | 2 | 17 |
| 04 | 05 | 6min | 2 | 8 |
| Phase 04 P02 | 5min | 2 tasks | 5 files |
| 04 | 04 | 5min | 2 | 8 |

## Last Session
- **Stopped at:** Completed 04-05-PLAN.md
- **Timestamp:** 2026-03-05T10:23:26Z
